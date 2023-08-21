<?php
/**
 * Plugin Name: ProSkaters Place Calculator
 * Description: Plugin for configuring the calculator on the ProSkaters Place website
 * Version: 0.9.9
 * Author: akulihin
 */


add_action( 'wp_enqueue_scripts', 'enqueue_scripts_on_web_side' );
add_action( 'admin_menu', 'add_admin_menu' );
add_action( 'admin_init', 'register_settings' );
add_action( 'wp_ajax_brands_table', 'update_option_brands_table' );
add_action( 'wp_ajax_brands_list', 'update_option_brands_list' );



// Enqueue scripts and styles
function enqueue_scripts_on_web_side() {
    if (is_page('calculator')) {
      wp_enqueue_script( 'psp-calculator-script', plugins_url( 'psp-calculator-script.js', __FILE__ ), array(), false, true );
      $script_params = array(
        'plugin_brands_table' => get_option('psp_calculator_plugin_brands_table_storage'),
        'plugin_brands_list' => get_option('psp_calculator_plugin_brands_list_storage')
      );
      wp_localize_script( 'psp-calculator-script', 'pspCalculatorPluginConfig', $script_params );

    }
}

// Add the configuration menu in wp-admin
function add_admin_menu() {
    add_options_page( 'ProSkaters Place Calculator', 'ProSkaters Place Calculator', 'manage_options', 'psp-calculator-plugin', 'psp_calculator_plugin_render_admin_page' );
}


function psp_calculator_plugin_render_admin_page() {
    wp_enqueue_style( 'psp-calculator-plugin-styles', plugins_url( 'sirinoksss.css', __FILE__ ) );
    
    
    wp_enqueue_script( 'psp-calculator-script', plugins_url( 'psp-calculator-script.js', __FILE__ ), array(), false, true );
    $script_params = array(
      'plugin_brands_table' => get_option('psp_calculator_plugin_brands_table_storage'),
      'plugin_brands_list' => get_option('psp_calculator_plugin_brands_list_storage')
    );
    wp_localize_script( 'psp-calculator-script', 'pspCalculatorPluginConfig', $script_params );

    ?>


<table class="form-table" role="presentation">
    <tbody>
        <tr>
            <th scope="row">Brands</th>
            <td>
            <input type="text" class="search-input" placeholder="Search...">
            <select multiple="multiple" class="psp-brand-dropdown" name="psp_calculator_plugin_brands">
                  <!-- Dynamic Content -->
            </select>
            </td>
        </tr>
    </tbody>
</table>
<button id="psp-add-brand-button">Add Brand</button>
<button id="psp-rename-brand-button">Rename Brand</button>
<button id="psp-delete-brand-button">Delete Brand</button>
<button id="psp-delete-invisible-data-brand-button">Delete Invisible Data</button>

<br>
<br>

<table id="data-table">
    <thead>
        <tr>
            <th>CM</th>
            <th>MP</th>
            <th>MONDO</th>
            <th>EU</th>
            <th>US women</th>
            <th>US men</th>
            <th>US junior</th>
            <th>UK women</th>
            <th>UK men</th>
            <th>UK junior</th>
        </tr>
    </thead>
    <tbody class="conversionTableContent">
        <!-- Dynamic Content -->
    </tbody>
</table>

<button id="add-row">Add Row</button>
<!-- <button id="add-rows">Add Rows!</button> -->

<div class="footer">
    <div class="left-corner">
    </div>
    <div class="right-corner">
    </div>
</div>

<script>
    jQuery(document).ready(function ($) {

        var brands_table = {};
        var brands_list = [];
        var isTableLoaded = false;

        if (!isTableLoaded) {
          console.log("Loading table from pspCalculatorPluginConfig...");
          brands_table = pspCalculatorPluginConfig.plugin_brands_table;
          if (brands_table.length == 0) {
            brands_table = {};
          }

          console.log("Loading list from pspCalculatorPluginConfig...");
          brands_list = pspCalculatorPluginConfig.plugin_brands_list;
          if (brands_list.length == 0) {
            brands_list = [];
          }
        }

        if (brands_list.length > 0) {
          brands_list.forEach(function (brandName) {
            psp_calculator_plugin_add_brand(brandName);
          });
        }

        if(document.querySelector('select[name="psp_calculator_plugin_brands"]').length > 0){
          document.querySelector('select[name="psp_calculator_plugin_brands"]')[0].selected = true;
          load_table();
        }


        function get_storage(table_name) {
            if (!brands_table[table_name]) {
                brands_table[table_name] = {};
            }
            return brands_table[table_name][get_selected_table()];
        }

        function set_storage(table_name, value) {
            if (!brands_table[table_name]) {
                brands_table[table_name] = {};
            }
            brands_table[table_name][get_selected_table()] = value;

            $.ajax({
                method: "POST",
                url: "/wp-admin/admin-ajax.php?action=brands_table",
                data: {
                    brands_table: brands_table
                },
                success: function (response) {
                    console.log(response);
                }
            });

        }

        function set_storage_remove_invisible_data(table_name) {
            var brands_table_temp = {};
            brands_table_temp[table_name] = {};

            for (const brand of pspCalculatorPluginConfig.plugin_brands_list) {
                brands_table_temp[table_name][brand] = brands_table[table_name][brand] || {};
            }

            $.ajax({
                method: "POST",
                url: "/wp-admin/admin-ajax.php?action=brands_table",
                data: {
                    brands_table: brands_table_temp
                },
                success: function (response) {
                    console.log(response);
                }
            });
        }

        function set_storage_void(table_name) {
            $.ajax({
                method: "POST",
                url: "/wp-admin/admin-ajax.php?action=brands_table",
                data: {
                    brands_table: brands_table
                },
                success: function (response) {
                    console.log(response);
                }
            });
        }

        function delete_storage(table_name) {
            delete brands_table[table_name][get_selected_table()]
        }

        function get_selected_table() {
            const selected_index = document.querySelector(".psp-brand-dropdown").selectedIndex;
            return document.querySelector(".psp-brand-dropdown").children[selected_index].innerText;
        }

        function load_table() {
            console.log("load_table");
            var table = document.querySelector("#data-table tbody");
            var data = get_storage("table_data") || [];

            table.innerHTML = data.map((row, index) => `
<tr data-index="${index}">
<td><input type="number" class="psp_sizing_cm" value="${row.psp_sizing_cm}"></td>        
<td><input type="number" class="psp_sizing_mp" value="${row.psp_sizing_mp}"></td>
<td><input type="number" class="psp_sizing_mondo" value="${row.psp_sizing_mondo}"></td>
<td><input type="number" class="psp_sizing_eu" value="${row.psp_sizing_eu}"></td>
<td><input type="number" class="psp_sizing_us_w" value="${row.psp_sizing_us_w}"></td>
<td><input type="number" class="psp_sizing_us_m" value="${row.psp_sizing_us_m}"></td>
<td><input type="number" class="psp_sizing_us_j" value="${row.psp_sizing_us_j}"></td>
<td><input type="number" class="psp_sizing_uk_w" value="${row.psp_sizing_uk_w}"></td>
<td><input type="number" class="psp_sizing_uk_m" value="${row.psp_sizing_uk_m}"></td>
<td><input type="number" class="psp_sizing_uk_j" value="${row.psp_sizing_uk_j}"></td>
<td>
    <button class="delete-row">Delete</button>
</td>
</tr>
`).join("");
        }


        // Update storage on input change
        document.addEventListener("input", async event => {
            console.log(event.target.className);
            if (["psp_sizing_cm", "psp_sizing_mp", "psp_sizing_mondo", "psp_sizing_eu", "psp_sizing_us_w", "psp_sizing_us_m", "psp_sizing_us_j", "psp_sizing_uk_w", "psp_sizing_uk_m", "psp_sizing_uk_k"].includes(event.target.className)) {
                console.log("saving?");
                var index = event.target.parentElement.parentElement.dataset.index;
                var data = get_storage("table_data");
                data[index][event.target.className] = event.target.value;
                set_storage("table_data", data);
            }
        });

        // Delete row button
        document.addEventListener("click", async event => {
            if (event.target.classList.contains("delete-row")) {
                var index = event.target.parentElement.parentElement.dataset.index;
                var data = get_storage("table_data") || [];
                
                data.splice(index, 1);

                set_storage("table_data", data);
                load_table();
            }
        });

        // Change brand table
        document.querySelector('select[name="psp_calculator_plugin_brands"]').addEventListener('change', function (event) {
            console.log("change brand");
            load_table();
        });

        // click brand table
        document.querySelector('select[name="psp_calculator_plugin_brands"]').addEventListener('click', function (event) {
            console.log("click brand");
            load_table();
        });


        // Add row button
        document.querySelector("#add-row").addEventListener("click", async () => {
            console.log("add-row");
            var data = get_storage("table_data") || [];
            data.push({
                psp_sizing_cm: 0,
                psp_sizing_mp: 0,
                psp_sizing_mondo: 0,
                psp_sizing_eu: 0,
                psp_sizing_us_w: 0,
                psp_sizing_us_m: 0,
                psp_sizing_us_j: 0,
                psp_sizing_uk_w: 0,
                psp_sizing_uk_m: 0,
                psp_sizing_uk_j: 0
            });
            set_storage("table_data", data);
            load_table();
        });

        /*// Add row button
        document.querySelector("#add-rows").addEventListener("click", async () => {
            console.log("add-rows!");
            var data = get_storage("table_data") || [];
            
            let start_cm = prompt("Starting CM", "16.5");
            let finish_cm = prompt("Finish CM", "35.5");
            let step_cm = prompt("Steps (0.5 or 1)", "0.5");
            
            let start_w_us = prompt("Starting Women US", "5");
            let start_m_us = prompt("Startming Men US", "6");
            let start_j_us = prompt("Starting Junior US", "10.5");

            let finish_w_us = prompt("Finish Women US", "12");
            let finish_m_us = prompt("Finish Men US", "18");
            let finish_j_us = prompt("Finish Junior US", "7");

            data.push({
                psp_sizing_cm: 0,
                psp_sizing_mp: 0,
                psp_sizing_mondo: 0,
                psp_sizing_eu: 0,
                psp_sizing_us_w: 0,
                psp_sizing_us_m: 0,
                psp_sizing_us_j: 0,
                psp_sizing_uk_w: 0,
                psp_sizing_uk_m: 0,
                psp_sizing_uk_j: 0
            });
            set_storage("table_data", data);
            load_table();
        });
        */
        



            const brand_dropdown = document.querySelector('.psp-brand-dropdown');
            const brandDropdown = document.querySelector('.psp-brand-dropdown');
            let isInteracting = false;

            document.querySelector('.search-input').addEventListener('input', function() {
              handleInteractionStart();
                const searchText = this.value.trim().toLowerCase();

                const options = brandDropdown.querySelectorAll('option');
                for (const option of options) {
                    const brandName = option.textContent.toLowerCase();
                    if (brandName.includes(searchText)) {
                        option.style.display = 'block';
                    } else {
                        option.style.display = 'none';
                    }
                }
            });

            function expandTable() {
                brand_dropdown.classList.add('expanded');
            }

            function shrinkTable() {
                brand_dropdown.classList.remove('expanded');
            }

            function handleInteractionStart() {
                if (!isInteracting) {
                    isInteracting = true;
                    expandTable();
                }
            }

            function handleInteractionEnd() {
                isInteracting = false;
                shrinkTable();
            }

            brandDropdown.addEventListener('focus', handleInteractionStart);
            brandDropdown.addEventListener('blur', handleInteractionEnd);

            // If you want the table to shrink when clicking outside the table and dropdown:
            document.addEventListener('click', function(event) {
                const target = event.target;
                if (!brand_dropdown.contains(target) && !target.classList.contains('search-input')) {
                    handleInteractionEnd();
                }
            });






        function save_brand_list(){
          var brands_list = [];
                var dropdown_options = document.querySelector('.psp-brand-dropdown').options;
for (let dropdown_option of dropdown_options) {
  brands_list.push(dropdown_option.value);
}
                console.log(`Sending brands_list: ${brands_list}`);
                console.log(brands_list);

            $.ajax({
                method: "POST",
                url: "/wp-admin/admin-ajax.php?action=brands_list",
                data: {
                  brands_list: brands_list
                },
                success: function (response) {
                    console.log(response);
                }
            });

        }

        // Add brand button click handler
        $('#psp-add-brand-button').click(function () {
            var brandName = prompt('Enter brand name:');
            if (brandName) {
                psp_calculator_plugin_add_brand(brandName);
                save_brand_list();
            }
        });

        // Delete brand button click handler
        $('#psp-delete-brand-button').click(function () {
            var selectedBrands = $('.psp-brand-dropdown option:selected');
            
            if (selectedBrands.length == 0) {
                alert('Please select at least one brand to delete');
                return;
            }

            if (confirm(`Are you sure you want to delete ${selectedBrands.length} selected brands?`)) {
                selectedBrands.each(function () {
                    $(this).remove();
                });
                save_brand_list();
            }
        });

        // Delete brand button click handler
        $('#psp-delete-invisible-data-brand-button').click(function () {
            if (confirm(`Are you sure you want to delete invisible data?`)) {
                set_storage_remove_invisible_data("table_data");
            }
        });
        

        // Rename brand button click handler
        $('#psp-rename-brand-button').click(function () {
            var selectedBrands = $('.psp-brand-dropdown option:selected');
            if (selectedBrands.length > 1) {
                alert('Please select only one brand to rename');
                return;
            }
            var brandName = prompt('Enter brand name:');
            if (brandName) {
                brands_table["table_data"][brandName] = brands_table["table_data"][selectedBrands[0].value];
                selectedBrands.val(brandName);
                selectedBrands.text(brandName);
                save_brand_list();
                set_storage_void("table_data");
            }
        });

        // Add a brand option to the dropdown
        function psp_calculator_plugin_add_brand(brandName) {
            $('.psp-brand-dropdown').append('<option value="' + brandName + '">' + brandName + '</option>');
        }
    });
</script>


    <?php
}

// Register the plugin settings and fields
function register_settings() {
    add_settings_section( 'psp-calculator-plugin-section', 'General Settings', '__return_false', 'psp-calculator-plugin-settings' );
}



function update_option_brands_table(){
  if(isset($_REQUEST)){
    $brands_table = $_REQUEST['brands_table'];
    update_option( 'psp_calculator_plugin_brands_table_storage', $brands_table );
  }
  die();
}


function update_option_brands_list(){ 
  if(isset($_REQUEST)){
    $brands_list = $_REQUEST['brands_list'];
    update_option( 'psp_calculator_plugin_brands_list_storage', $brands_list );
  }
  die();
}

function my_console_log(...$data) {
  $json = json_encode($data);
  add_action('shutdown', function() use ($json) {
     echo "$json";
  });
}
