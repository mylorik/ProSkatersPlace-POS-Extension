var browser = browser || chrome;
//
const api = "https://api.exchangerate-api.com/v4/latest/USD";
var currency;
var known_prices = {};
var exchangerate_ready = false;
const sleep_time = 250;
const delete_times = 15;    

async function get_exchangerate() {
    const result = await $.ajax({
        url: api,
        type: "GET",
    });
    if (result.rates["USD"] != undefined) {
        exchangerate_ready = true;
        console.log("Exchange rate is ready!");
    }
    return (currency = result);
}


function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}


function hasClass(elem, className) {
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
            if (!hasClass(cart[0], "empty")) {
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
            if (hasClass(e.target, "canadian-price")) {
                for (const product of document.querySelector(".panel-body.list.cart-list").children[0].children) {
                    //get price
                    const title = $(product).find('[data-name="title"]').text();
                    var price_usd_check = 0;
                    if (known_prices[title] == undefined) {
                        const price_usd = $(product).find('[data-numpad="discount"]').val().replace(",", "");
                        price_usd_check = price_usd;
                        const fromRate = currency.rates["USD"];
                        const toRate = currency.rates["CAD"];
                        const price_cad_temp = `${((toRate / fromRate) * price_usd).toFixed(2)}`;
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
