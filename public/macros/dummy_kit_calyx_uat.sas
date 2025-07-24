option nomprint;

%setup(version=260,
       localsetup=root/cdar/%scan(&_exec_programpath.,3,/)/%scan(&_exec_programpath.,4,/)/ar/%scan(&_exec_programpath.,6,/)/common/dev/macro/localsetup.sas);

%localsetup;

options source;

libname rawtp "&studydir./raw/&execution_areax./data/data_area";

option mprint;

%macro dummy_group(
    treatment_codes,    /* Treatment group codes (colon-separated) */
    treatment_names,    /* Treatment group names (colon-separated) */
    proportions,        /* Allocation proportions (colon-separated) */
    input_dataset=rawtp.dm,  /* Input dataset */
    output_lib=work,       /* Output library */
    output_dataset=randomized, /* Output dataset name */
    strata1_var=,       /* Stratification variable 1 name */
    strata1_levels=,    /* Stratum levels for variable 1 */
    strata2_var=,       /* Stratification variable 2 name */
    strata2_levels=,    /* Stratum levels for variable 2 */
    strata3_var=,       /* Stratification variable 3 name */
    strata3_levels=,    /* Stratum levels for variable 3 */
    seed=12345,         /* Random seed for reproducibility */
    stat_output=summary_stats, /* Output dataset for summary stats */
    debug=N             /* Debug mode [Y/N] */
);

    /* Step 1: Validate required parameters */
    %if %length(&input_dataset) = 0 %then %do;
        %put ERROR: input_dataset is required;
        %return;
    %end;

    /* Constant for modulo operation - 2^31-1 = 2147483647 */
    %let max_seed = 2147483647;

    /* Step 2: Parse treatment group parameters */
    %let num_treatments = %sysfunc(countw(&treatment_codes, :));

    /* Step 3: Calculate number of stratum levels (WITH DEFAULT VALUES) */
    %if &strata1_var ne %then %let n_levels1 = %sysfunc(countw(&strata1_levels, :));
    %else %let n_levels1 = 0;

    %if &strata2_var ne %then %let n_levels2 = %sysfunc(countw(&strata2_levels, :));
    %else %let n_levels2 = 0;

    %if &strata3_var ne %then %let n_levels3 = %sysfunc(countw(&strata3_levels, :));
    %else %let n_levels3 = 0;

    /* Step 4: Create patient-level stable seeds with modulo */

%let max_seed = 2147483647; /* 2^31-1 */

data _temp_base;
    set &input_dataset;
    where not missing(PATIENT);


    length seed_str $50 md5_hex $32;
    seed_str = catx('_', "&seed", PATIENT);
    md5_hex = put(md5(seed_str), $hex32.);


    patient_seed = 0;


    if length(md5_hex) >= 8 then do;
        substr1 = substr(md5_hex,1,8);
        part1 = input(substr1, hex8.);
        patient_seed = part1;
    end;


    if length(md5_hex) >= 16 then do;
        substr2 = substr(md5_hex,9,8);
        part2 = input(substr2, hex8.);
        patient_seed = mod(patient_seed * part2, &max_seed);
    end;


    if length(md5_hex) >= 24 then do;
        substr3 = substr(md5_hex,17,8);
        part3 = input(substr3, hex8.);
        patient_seed = mod(patient_seed + part3, &max_seed);
    end;


    if length(md5_hex) > 24 then do;
        substr4 = substr(md5_hex,25,8);
        part4 = input(substr4, hex8.);
        patient_seed = mod(patient_seed + part4, &max_seed);
    end;


    patient_seed = mod(patient_seed, &max_seed) + 1;
    if patient_seed < 1 then patient_seed = &max_seed;


    %if %upcase(&debug) = Y %then %do;
        putlog "DEBUG: " PATIENT= seed_str= md5_hex=
               substr1= part1=
               substr2= part2=
               substr3= part3=
               patient_seed=;
    %end;

    drop seed_str md5_hex substr1 substr2 substr3 substr4
         part1 part2 part3 part4;
run;

    /* Sort by PATIENT for consistent processing */
    proc sort data=_temp_base;
        by PATIENT;
    run;

    /* Step 5: Generate stratification variables using stable seeds */
    data _temp_strata;
        set _temp_base;

        /* Generate stratification variable 1 */
        %if &strata1_var ne %then %do;
            %if &strata1_levels. ne  %then %do;
                call ranuni(patient_seed, rand1);
                r = ceil(rand1 * &n_levels1);
                &strata1_var = scan("&strata1_levels", r, ':');
                drop rand1;
            %end;
            %else %do;
                %put ERROR: strata1_levels not specified for &strata1_var;
                %abort;
            %end;
        %end;

        /* Generate stratification variable 2 */
        %if &strata2_var ne %then %do;
            %if &strata2_levels. ne  %then %do;
                patient_seed_2 = patient_seed +1;
                call ranuni(patient_seed_2, rand2);
                r = ceil(rand2 * &n_levels2);
                &strata2_var = scan("&strata2_levels", r, ':');
                drop rand2;
            %end;
            %else %do;
                %put ERROR: strata2_levels not specified for &strata2_var;
                %abort;
            %end;
        %end;

        /* Generate stratification variable 3 */
        %if &strata3_var ne %then %do;
            %if &strata3_levels. ne  %then %do;
                patient_seed_3 = patient_seed +2;
                call ranuni(patient_seed_3, rand3);
                r = ceil(rand3 * &n_levels3);
                &strata3_var = scan("&strata3_levels", r, ':');
                drop rand3;
            %end;
            %else %do;
                %put ERROR: strata3_levels not specified for &strata3_var;
                %abort;
            %end;
        %end;

        drop r seed_str patient_seed_2 patient_seed_3;
    run;

    /* Step 6: Create combined stratum variable for randomization */
    data _temp_strata;
        set _temp_strata;
        length combostr $100;
        combostr = catx('|',
            %if &strata1_var ne %then %do; &strata1_var %end;
            %if &strata2_var ne %then %do; ,&strata2_var %end;
            %if &strata3_var ne %then %do; ,&strata3_var %end;
        );
    run;

    /* Step 7: Calculate normalized proportions */
    %let total_proportion = 0;
    %do i = 1 %to &num_treatments;
        %let proportion&i = %scan(&proportions, &i, :);
        %let total_proportion = %sysevalf(&&total_proportion + &&proportion&i);
    %end;

    /* Step 8: Calculate cumulative proportions */
    data _null_;
        retain cum_proportion 0;
        %do i = 1 %to &num_treatments;
            proportion = %scan(&proportions, &i, :) / &total_proportion;
            cum_proportion + proportion;
            call symputx("cum_proportion&i", cum_proportion);
        %end;
    run;

    /* Step 9: Stratified randomization with modulo for group seeds */
    proc sort data=_temp_strata;
        by combostr;
    run;

    data &output_lib..&output_dataset;
        set _temp_strata;
        by combostr;

        retain group_rand_seed;
        if first.combostr then do;
            /* Create group-level seed */
            length group_seed_str $200;
            group_seed_str = catx('_', put(patient_seed, best32.), combostr);
            group_rand_seed = input(put(md5(group_seed_str), $hex16.), hex16.);

            /* Apply modulo and ensure within valid range */
            group_rand_seed = mod(group_rand_seed, &max_seed) + 1;
            if group_rand_seed < 1 then group_rand_seed = &max_seed;
        end;

        /* Generate random number for treatment assignment */
        call ranuni(group_rand_seed, rand_group);

        /* Assign treatment group */
        %do i = 1 %to &num_treatments;
            %if &i = 1 %then %do;
                if rand_group <= &&cum_proportion&i then do;
            %end;
            %else %do;
                else if rand_group <= &&cum_proportion&i then do;
            %end;
                    trt_code = "%scan(&treatment_codes, &i, :)";
                    trt_name = "%scan(&treatment_names, &i, :)";
                end;
        %end;
        drop rand_group group_seed_str group_rand_seed combostr patient_seed;
    run;

    /* Step 10: Calculate total number of patients */
    proc sql noprint;
        select count(*) into :total_patients
        from &output_lib..&output_dataset;
    quit;

    %put NOTE: Total patients = &total_patients;

        /* Step 11: Generate summary statistics with percentages (FIXED AMBIGUOUS REFERENCES) */
    %local strat_vars n_strat;
    %let strat_vars =;
    %if &strata1_var ne %then %let strat_vars = &strat_vars &strata1_var;
    %if &strata2_var ne %then %let strat_vars = &strat_vars &strata2_var;
    %if &strata3_var ne %then %let strat_vars = &strat_vars &strata3_var;
    %let n_strat = %sysfunc(countw(&strat_vars));

    /* Create statistics dataset with percentages */
    proc sql;
        %if &n_strat > 0 %then %do;
            /* Calculate stratum totals */
            create table _temp_stratum_totals as
            select
                %do i=1 %to &n_strat;
                    %scan(&strat_vars, &i),
                %end;
                count(*) as stratum_total
            from &output_lib..&output_dataset
            group by
                %do i=1 %to &n_strat;
                    %scan(&strat_vars, &i)
                    %if &i < &n_strat %then ,;
                %end;
            ;

            /* FIXED: Explicit table aliases in ON clause and GROUP BY */
            create table &stat_output as
            select
                %do i=1 %to &n_strat;
                    a.%scan(&strat_vars, &i) as Stratum&i,
                %end;
                a.trt_code,
                a.trt_name,
                count(*) as patient_count,
                calculated patient_count / b.stratum_total as within_stratum_pct format=percent8.1,
                calculated patient_count / &total_patients as overall_pct format=percent8.1
            from &output_lib..&output_dataset a
            inner join _temp_stratum_totals b
            on
                %do i=1 %to &n_strat;
                    a.%scan(&strat_vars, &i) = b.%scan(&strat_vars, &i)
                    %if &i < &n_strat %then and;
                %end;
            group by
                %do i=1 %to &n_strat;
                    a.%scan(&strat_vars, &i),
                %end;
                a.trt_code,
                a.trt_name
            order by
                %do i=1 %to &n_strat;
                    a.%scan(&strat_vars, &i),
                %end;
                a.trt_code;

            drop table _temp_stratum_totals;
        %end;
        %else %do;
            create table &stat_output as
            select
                trt_code,
                trt_name,
                count(*) as patient_count,
                calculated patient_count / &total_patients as overall_pct format=percent8.1
            from &output_lib..&output_dataset
            group by trt_code, trt_name;
        %end;
    quit;

       /* Step 12: Output report with headers and percentages */
    title "Stratified Randomization Summary";
    title2 "Total Patients: &total_patients";
    footnote "Generated on %sysfunc(date(), worddate.) at %sysfunc(time(), timeampm.)";

/* Determine which strata variables are actually used */
    %let actual_strat_vars =;
    %let strat_count = 0;

    /* Check for Strata 1 */
    %if &strata1_var ne %then %do;
        %if %symexist(n_levels1) and &n_levels1 > 0 %then %do;
            %let actual_strat_vars = &actual_strat_vars &strata1_var;
            %let strat_count = %eval(&strat_count + 1);
        %end;
    %end;

    /* Check for Strata 2 */
    %if &strata2_var ne %then %do;
        %if %symexist(n_levels2) and &n_levels2 > 0 %then %do;
            %let actual_strat_vars = &actual_strat_vars &strata2_var;
            %let strat_count = %eval(&strat_count + 1);
        %end;
    %end;

    /* Check for Strata 3 */
    %if &strata3_var ne %then %do;
        %if %symexist(n_levels3) and &n_levels3 > 0 %then %do;
            %let actual_strat_vars = &actual_strat_vars &strata3_var;
            %let strat_count = %eval(&strat_count + 1);
        %end;
    %end;

    %let n_actual_strat = &strat_count;

    proc report data=&stat_output nowd headline spacing=2;
        columns
            %do i=1 %to &n_actual_strat;
                Stratum&i
            %end;
            trt_code trt_name patient_count within_stratum_pct overall_pct;

        /* Define stratification columns */
        %do i=1 %to &n_actual_strat;
            define Stratum&i / display "Stratum &i" width=15 order;
        %end;

        /* Define treatment columns */
        define trt_code     / display "Treatment Code" width=12;
        define trt_name     / display "Treatment Name" width=25;
        define patient_count/ display "Patient Count" width=15 format=comma6.;
        define within_stratum_pct / display "Within Stratum %" width=18 format=percent8.1;
        define overall_pct  / display "Overall %" width=12 format=percent8.1;

        /* Add grouping to prevent duplicate headings */
        compute before;
            %do i=1 %to &n_actual_strat;
                line Stratum&i $varying.;
            %end;
        endcomp;

        /* Break between different stratification levels */
        %if &n_actual_strat > 0 %then %do;
            break after Stratum&n_actual_strat / summarize;
        %end;
    run;

    title;
    footnote;

    /* Step 13: Conditional cleanup */
    %if %upcase(&debug) = Y %then %do;
        %put DEBUG: All intermediate datasets retained in WORK library;
        %put DEBUG: - _temp_base:       %sysfunc(pathname(work))._temp_base;
        %put DEBUG: - _temp_strata:     %sysfunc(pathname(work))._temp_strata;

        /* Debug output for summary statistics */
        proc print data=&stat_output;
            title "Debug: Summary Statistics Output";
        run;
        title;
    %end;
    %else %do;
        proc datasets lib=work nolist;
            delete _temp_base _temp_strata;
        quit;
        %put NOTE: All temporary datasets cleaned up;
    %end;

%mend dummy_group;

/* Example macro call - WITH FIXED PARAMETERS */
%dummy_group(
    treatment_codes = A:B:C,
    treatment_names = Placebo:Drug:Control,
    proportions = 1:1:1,
    output_dataset = final_randomized,
    strata1_var = GENDER,
    strata1_levels = M:F,
    strata2_var = AGE_GROUP,
    strata2_levels = <65:>=65,
    seed = 123456789,
    debug = Y
);