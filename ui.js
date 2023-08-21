var browser = browser || chrome;
//
var currency;
var known_prices = {};
var exchangerate_ready = false;
const sleep_time = 250;
const delete_times = 15;


function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function get_storage(index = 'percentage_offset') {
    try {
        return new Promise(function (resolve, reject) {
            browser.storage.sync.get(index, function (recipes) {
                resolve(recipes);
            });
        });
    }
    catch (err) {
        return "буль";
    }
}
async function get_percentage_offset() {
    var percentage_offset_value = await get_storage();
    percentage_offset_value = percentage_offset_value['percentage_offset'];
    if(percentage_offset_value < 10){
        return 1.00 + parseFloat(`0.0${percentage_offset_value}`);
    }
    if(percentage_offset_value < 100){
        return 1.00 + parseFloat(`0.${percentage_offset_value}`);
    }
    if(percentage_offset_value == 100){
        return 2;
    }
    if(percentage_offset_value == 0){
        return 1;
    }
}

async function get_exchangerate() {
    var api_key = await get_storage("api_key");
    api_key = api_key["api_key"];
    const result = await $.ajax({
        url: `https://v6.exchangerate-api.com/v6/${api_key}/latest/USD`,
        type: "GET",
    });
    if (result.conversion_rates["USD"] != undefined) {
        exchangerate_ready = true;
        console.log("Exchange rate is ready!");
    }
    return (currency = result);
}

function has_class(elem, className) {
    return elem.className.split(" ").indexOf(className) > -1;
}


function edit_product(product, price_cad) {
    //input top price
    $(product).find('[name="item_price"]').click();
    for (let index = 0; index < delete_times; index++) {
        $(`.numpad`).find('[data-key="del"]').click();
    }
    for (var i = 0; i < price_cad.length; i++) {
        $(`.numpad`).find(`[data-key="${price_cad.charAt(i)}"]`).click();
    }
    $('[data-key="ret"]').click();
    //end

    //input bottom price
    if (product.querySelector("#regular_price") == undefined) {
        $(product).find('[data-action="more"]').children()[0].click();
    }

    $('[name="regular_price"]').click();
    for (let index = 0; index < delete_times; index++) {
        $(`.numpad`).find('[data-key="del"]').click();
    }
    for (var i = 0; i < price_cad.length; i++) {
        $(`.numpad`).find(`[data-key="${price_cad.charAt(i)}"]`).click();
    }
    $('[data-key="ret"]').click();
    $(product).find('[data-action="more"]').children()[0].click();
    //end

    //Indicate CAD price in Total
    $(product).find('.total').text(`CAD $${price_cad}`);
    //end

    //Indicate CAD price in Price
    product.querySelectorAll('.price')[1].children[0].value = price_cad;
    //end
}

async function create_button() {
    var voided = false;
    while (true) {
        try {
            if (!exchangerate_ready) {
                console.log("Waiting for exchange rate...");
                await sleep(sleep_time);
                continue;
            }
            var cart = document.querySelector(".cart-actions").children;
            if (!voided) {
                //void the current cart
                voided = true;
                $('[data-action="void"]').click();
                //end
            }
            if (cart.length > 0) {
                if (cart[0].querySelector(".canadian-price") == undefined) {
                    //add button
                    const span = document.createElement("button");
                    span.classList.add("btn");
                    span.classList.add("btn-success");
                    span.classList.add("pull-left");
                    span.classList.add("canadian-price");
                    span.innerHTML = "> Canadian Price <";
                    const a = document.createElement("a");
                    a.appendChild(span);
                    cart[0].appendChild(a);
                    //end

                    //add input
                    $(".cart-header > .price").clone().insertAfter('.cart-header > .price');
                    document.querySelector(".cart-header").querySelector(".price").innerText = "Discount";
                    //end
                }
            }

            var cart = document.querySelector(".panel-body.list.cart-list").children[0].children;
            if (!has_class(cart[0], "empty")) {
                for (const product of cart) {
                    if (product.querySelectorAll(".price").length == 1) {
                        $(product).find(".price").clone().insertAfter($(product).find(".price"));
                        product.querySelectorAll(".price")[1].innerHTML = `<input type="text" name="item_price_cad" class="form-control autogrow" style="width: 63px;">`;
                        product.querySelectorAll(".price")[1].addEventListener('keypress', function (e) {
                            if (e.key === 'Enter') {
                                const product = e.path[3];
                                const price_cad = e.path[0].value;
                                edit_product(product, price_cad)
                            }
                        });
                    }
                }
            }

            await sleep(sleep_time);
        } catch (error) {
            console.log(error);
            await sleep(sleep_time);
        }
    }
}

window.onload = async function () {
    currency = get_exchangerate();
    create_button();
    document.addEventListener(
        "click",
        async function (e) {
            if (has_class(e.target, "canadian-price")) {
                for (const product of document.querySelector(".panel-body.list.cart-list").children[0].children) {
                    //get price
                    const title = $(product).find('[data-name="title"]').text();
                
                    if (known_prices[title] == undefined) {
                        const price_usd = $(product).find('[data-numpad="discount"]').val().replace(",", "");
                        const fromRate = currency.conversion_rates["USD"]
                        const toRate = currency.conversion_rates["CAD"].toFixed(3);
                        const converted = (toRate / fromRate) * price_usd;
                        const offset = await get_percentage_offset();
                        const price_cad_temp = `${Math.round(converted * offset)}`;
                        console.log(price_cad_temp);
                        known_prices[title] = price_cad_temp
                    }
                    const price_cad = known_prices[title];

                    if ($(product).find('.total').text().includes('CAD') || $(product).find('.total').text().split("$").length == 3) {
                        continue;
                    }
                    //end

                    edit_product(product, price_cad)
                }
            }
        },
        false
    );
};
