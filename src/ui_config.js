import { getVectorColumnNames } from './server_requests';


// Some input fields are rendered differently conditional upon the state of other input fields.
// This file describes these dependencies between fields.
//
// Format:
// const uiSpec = {
//     modelName: {  
//        category: {
//            arg: f
//         }
//     }
// }
// where
// - `modelName` equals `ARGS_SPEC.model_name`
// - `category` is a category that the SetupTab component looks for
//    (currently `enabledFunctions` or `dropdownFunctions`)
// - `f` is a function that accepts `SetupTab.state` as its one argument 
//     - in the `enabledFunctions` section, `f` returns a boolean where true = enabled, false = disabled
//     - in the `dropdownFunctions` section, `f` returns a list of dropdown options.

// When the SetupTab component renders, it calls `f(this.state)` to get
// the enabled state of each input, and dropdown options if any.



function isSufficient(argkey, state) {
    return state.argsEnabled[argkey] && !!state.argsValues.[argkey].value;
}

function isNotSufficient(argkey, state) {
    return !isSufficient(argkey, state);
}


const uiSpec = {
    'InVEST Carbon Model': {
        order: [
            ["workspace_dir", "results_suffix"],
            ["lulc_cur_path", "carbon_pools_path"],
            ["calc_sequestration", "lulc_fut_path", "lulc_cur_year", "lulc_fut_year"],
            ["do_redd", "lulc_redd_path"],
            ["do_valuation", "price_per_metric_ton_of_c", "discount_rate", "rate_change"]
        ],
        enabledFunctions: {
            lulc_cur_year: isSufficient.bind(null, 'calc_sequestration'),
            lulc_fut_year: isSufficient.bind(null, 'calc_sequestration'),
            lulc_fut_path: isSufficient.bind(null, 'calc_sequestration'),
            
            do_redd: isSufficient.bind(null, 'calc_sequestration'),
            lulc_redd_path: isSufficient.bind(null, 'do_redd'),

            do_valuation: isSufficient.bind(null, 'calc_sequestration'),
            price_per_metric_ton_of_c: isSufficient.bind(null, 'do_valuation'),
            discount_rate: isSufficient.bind(null, 'do_valuation'),
            rate_change: isSufficient.bind(null, 'do_valuation'),
        }
    },
    'Coastal Blue Carbon': {
        order: [
            ["workspace_dir", "results_suffix"],
            ["landcover_snapshot_csv", "biophysical_table_path", "landcover_transitions_table", "analysis_year"],
            ["do_economic_analysis", "use_price_table", "price", "inflation_rate", "price_table_path", "discount_rate"]
        ],
        enabledFunctions: {
            use_price_table: isSufficient.bind(null, 'do_economic_analysis'),
            price: (state => isSufficient('do_economic_analysis', state) && 
                isNotSufficient('use_price_table', state)),
            inflation_rate: (state => isSufficient('do_economic_analysis', state) && 
                isNotSufficient('use_price_table', state)),
            price_table_path: isSufficient.bind(null, 'use_price_table'),
            discount_rate: isSufficient.bind(null, 'do_economic_analysis'),
        }
    },
    'Coastal Blue Carbon Preprocessor': {
        order: [
            ["workspace_dir", "results_suffix"],
            ["lulc_lookup_table_path", "landcover_snapshot_csv"]
        ]
    },
    'Coastal Vulnerability': {
        order: [
            ["workspace_dir", "results_suffix"],
            ["aoi_vector_path", "model_resolution"],
            ["landmass_vector_path", "wwiii_vector_path", "max_fetch_distance"],
            ["bathymetry_raster_path", "dem_path", "dem_averaging_radius"],
            ["shelf_contour_vector_path", "habitat_table_path"],
            ["geomorphology_vector_path", "geomorphology_fill_value"],
            ["population_raster_path", "population_radius"],
            ["slr_vector_path", "slr_field"]
        ],
        dropdownFunctions: {
            slr_field: (async (state) => {
                    const result = await getVectorColumnNames(state.argsValues['slr_vector_path'].value);
                    return result.colnames || [];
                }
            )
        },
        enabledFunctions: {
            slr_field: isSufficient.bind(null, 'slr_vector_path'),
            geomorphology_fill_value: isSufficient.bind(null, 'geomorphology_vector_path'),
            population_radius: isSufficient.bind(null, 'population_raster_path'),
        }
    },
    'Crop Production Percentile Model': {
        order: [
            ["workspace_dir", "results_suffix"],
            ["landcover_raster_path", "landcover_to_crop_table_path", "aggregate_polygon_path", "model_data_path"]
        ]
    },
    'Crop Production Regression Model': {
        order: [
            ["workspace_dir", "results_suffix"],
            ["landcover_raster_path", "landcover_to_crop_table_path", "fertilization_rate_table_path", "aggregate_polygon_path", "model_data_path"]
        ]
    },
    'DelineateIt: Watershed Delineation': {
        order: [
            ["workspace_dir", "results_suffix"],
            ["dem_path", "detect_pour_points", "outlet_vector_path", "skip_invalid_geometry"],
            ["snap_points", "flow_threshold", "snap_distance"]
        ],
        enabledFunctions: {
            outlet_vector_path: isNotSufficient.bind(null, 'detect_pour_points'),
            skip_invalid_geometry: isNotSufficient.bind(null, 'detect_pour_points'),
            // TODO snap_points enabled on _vector_may_contain_points, need new endpoint
            flow_threshold: isSufficient.bind(null, 'snap_points'),
            snap_distance: isSufficient.bind(null, 'snap_points')
        }
    },
    'Finfish Aquaculture': {
        order: [
            ["workspace_dir"],
            ["ff_farm_loc", "farm_ID"],
            ["g_param_a", "g_param_b", "g_param_tau"],
            ["use_uncertainty", "g_param_a_sd", "g_param_b_sd", "num_monte_carlo_runs"],
            ["water_temp_tbl", "farm_op_tbl", "outplant_buffer"],
            ["do_valuation", "p_per_kg", "frac_p", "discount"]
        ],
        dropdownFunctions: {
            farm_ID: (async (state) => {
                    const result = await getVectorColumnNames(state.argsValues['ff_farm_loc'].value);
                    return result.colnames || [];
                }
            )
        },
        enabledFunctions: {
            farm_ID: isSufficient.bind(null, 'ff_farm_loc'),
            g_param_a_sd: isSufficient.bind(null, 'use_uncertainty'),
            g_param_b_sd: isSufficient.bind(null, 'use_uncertainty'),
            num_monte_carlo_runs: isSufficient.bind(null, 'use_uncertainty'),
            p_per_kg: isSufficient.bind(null, 'do_valuation'),
            frac_p: isSufficient.bind(null, 'do_valuation'),
            discount: isSufficient.bind(null, 'do_valuation')
        }
    },
    'Fisheries': {
        order: [
            ["workspace_dir", "results_suffix"],
            ["aoi_vector_path", "total_timesteps"],
            ["population_type", "sexsp", "harvest_units"],
            ["do_batch", "population_csv_path", "population_csv_dir"],
            ["total_init_recruits", "recruitment_type", "spawn_units", "alpha", "beta", "total_recur_recruits"],
            ["migr_cont", "migration_dir"],
            ["val_cont", "frac_post_process", "unit_price"]

        ],
        enabledFunctions: {
            population_csv_path: isNotSufficient.bind(null, 'do_batch'),
            population_csv_dir: isSufficient.bind(null, 'do_batch'), 
            spawn_units: (state => isSufficient('recruitment_type', state) && 
                ['Beverton-Holt', 'Ricker'].includes(state.argsValues['recruitment_type'].value)),
            alpha: (state => isSufficient('recruitment_type', state) && 
                ['Beverton-Holt', 'Ricker'].includes(state.argsValues['recruitment_type'].value)),
            beta: (state => isSufficient('recruitment_type', state) && 
                ['Beverton-Holt', 'Ricker'].includes(state.argsValues['recruitment_type'].value)),
            total_recur_recruits: (state => isSufficient('recruitment_type', state) && 
                state.argsValues['recruitment_type'].value === 'Fixed'), 
            migration_dir: isSufficient.bind(null, 'migr_cont'),
            frac_post_process: isSufficient.bind(null, 'val_cont'),
            unit_price: isSufficient.bind(null, 'val_cont'),
        }
    },
    'Fisheries Habitat Scenario Tool': {
        order: [
            ["workspace_dir", "results_suffix"],
            ["population_csv_path", "sexsp"],
            ["habitat_dep_csv_path", "habitat_chg_csv_path", "gamma"]
        ]
    },
    'Forest Carbon Edge Effect Model': {
        order: [
            ["workspace_dir", "results_suffix"],
            ["lulc_raster_path", "biophysical_table_path", "pools_to_calculate"],
            ["compute_forest_edge_effects", "tropical_forest_edge_carbon_model_vector_path", "n_nearest_model_points", "biomass_to_carbon_conversion_factor"],
            ["aoi_vector_path"]
        ],
        enabledFunctions: {
            tropical_forest_edge_carbon_model_vector_path: isSufficient.bind(null, 'compute_forest_edge_effects'),
            n_nearest_model_points: isSufficient.bind(null, 'compute_forest_edge_effects'),
            biomass_to_carbon_conversion_factor: isSufficient.bind(null, 'compute_forest_edge_effects')
        }
    },
    'GLOBIO': {
        order: [
            ["workspace_dir", "results_suffix"],
            ["predefined_globio", "globio_lulc_path"],
            ["lulc_to_globio_table_path", "lulc_path", "pasture_path", "potential_vegetation_path", "primary_threshold", "pasture_threshold"],
            ["aoi_path", "infrastructure_dir", "intensification_fraction", "msa_parameters_path"]
        ],
        enabledFunctions: {
            globio_lulc_path: isSufficient.bind(null, 'predefined_globio'),
            lulc_to_globio_table_path: isNotSufficient.bind(null, 'predefined_globio'),
            lulc_path: isNotSufficient.bind(null, 'predefined_globio'),
            pasture_path: isNotSufficient.bind(null, 'predefined_globio'),
            potential_vegetation_path: isNotSufficient.bind(null, 'predefined_globio'),
            primary_threshold: isNotSufficient.bind(null, 'predefined_globio'),
            pasture_threshold: isNotSufficient.bind(null, 'predefined_globio')
        }
    },
    'Habitat Quality': {
        order: [
            ["workspace_dir", "results_suffix"],
            ["lulc_cur_path", "lulc_fut_path", "lulc_bas_path"],
            ["threats_table_path", "access_vector_path", "sensitivity_table_path", "half_saturation_constant"]
        ]
    },
    'Habitat Risk Assessment': {
        order: [
            ["workspace_dir", "results_suffix"],
            ["info_table_path", "criteria_table_path"],
            ["resolution", "max_rating"],
            ["risk_eq", "decay_eq"],
            ["aoi_vector_path"],
            ["visualize_outputs"]
        ]
    },
    'Hydropower Water Yield': {
        order: [
            ["workspace_dir", "results_suffix"],
            ["precipitation_path", "eto_path", "depth_to_root_rest_layer_path", "pawc_path"],
            ["lulc_path", "biophysical_table_path", "seasonality_constant"],
            ["watersheds_path", "sub_watersheds_path"],
            ["demand_table_path", "valuation_table_path"]
        ]
    },
    'Nutrient Delivery Ratio Model (NDR)': {
        order: [
            ["workspace_dir", "results_suffix"],
            ["dem_path", "lulc_path", "runoff_proxy_path", "watersheds_path", "biophysical_table_path"],
            ["calc_p", "subsurface_critical_length_p", "subsurface_eff_p"],
            ["calc_n", "subsurface_critical_length_n", "subsurface_eff_n"],
            ["threshold_flow_accumulation", "k_param"],
        ]
    },
    'Crop Pollination': {
        order: [
            ["workspace_dir", "results_suffix"],
            ["landcover_raster_path", "landcover_biophysical_table_path"],
            ["guild_table_path", "farm_vector_path"]
        ]
    },
    'Recreation Model': {
        order: [
            ["workspace_dir", "results_suffix"],
            ["aoi_path", "start_year", "end_year"],
            ["compute_regression", "predictor_table_path", "scenario_predictor_table_path"],
            ["grid_aoi", "grid_type", "cell_size"]
        ]
    },
    'RouteDEM': {
        order: [
            ["workspace_dir", "results_suffix"],
            ["dem_path", "dem_band_index"],
            ["calculate_slope"],
            ["algorithm"],
            ["calculate_flow_direction"],
            ["calculate_flow_accumulation"],
            ["calculate_stream_threshold", "threshold_flow_accumulation", "calculate_downstream_distance"]
        ]
    },
    'Scenario Generator: Proximity Based': {
        order: [
            ["workspace_dir", "results_suffix"],
            ["base_lulc_path", "aoi_path"],
            ["area_to_convert", "focal_landcover_codes", "convertible_landcover_codes", "replacment_lucode"],
            ["convert_farthest_from_edge", "convert_nearest_to_edge", "n_fragmentation_steps"]
        ]
    },
    'Unobstructed Views: Scenic Quality Provision': {
        order: [
            ["workspace_dir", "results_suffix"],
            ["aoi_path", "structure_path", "dem_path", "refraction"],
            ["do_valuation", "valuation_function", "a_coef", "b_coef", "max_valuation_radius"]
        ]
    },
    'Sediment Delivery Ratio Model (SDR)': {
        order: [
            ["workspace_dir", "results_suffix"],
            ["dem_path", "erosivity_path", "erodibility_path"],
            ["lulc_path", "biophysical_table_path"],
            ["watersheds_path", "drainage_path"],
            ["threshold_flow_accumulation", "k_param", "sdr_max", "ic_0_param"]
        ]
    },
    'Seasonal Water Yield': {
        order: [
            ["workspace_dir", "results_suffix"],
            ["et0_dir", "precip_dir", "rain_events_table_path"],
            ["lulc_raster_path", "biophysical_table_path"],
            ["dem_raster_path", "soil_group_path", "aoi_path"],
            ["threshold_flow_accumulation", "alpha_m", "beta_i", "gamma"],
            ["user_defined_climate_zones", "climate_zone_table_path", "climate_zone_raster_path"],
            ["user_defined_local_recharge", "l_path"],
            ["monthly_alpha", "monthly_alpha_path"]
        ]
    },
    'Urban Cooling Model': {
        order: [
            ["workspace_dir", "results_suffix"],
            ["et0_dir", "precip_dir", "rain_events_table_path"],
            ["lulc_raster_path", "biophysical_table_path"],
            ["dem_raster_path", "soil_group_path", "aoi_path"],
            ["threshold_flow_accumulation", "alpha_m", "beta_i", "gamma"],
            ["user_defined_climate_zones", "climate_zone_table_path", "climate_zone_raster_path"],
            ["user_defined_local_recharge", "l_path"],
            ["monthly_alpha", "monthly_alpha_path"]
        ]
    },
    'Urban Flood Risk Mitigation': {
        order: [
            ["workspace_dir", "results_suffix"],
            ["aoi_watersheds_path", "rainfall_depth"],
            ["lulc_path", "curve_number_table_path", "soils_hydrological_group_raster_path"],
            ["built_infrastructure_vector_path", "infrastructure_damage_loss_table_path"]
        ]
    }
}


module.exports = uiSpec;
