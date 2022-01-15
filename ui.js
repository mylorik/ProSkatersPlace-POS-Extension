var browser = browser || chrome;
//
const api = "https://api.exchangerate-api.com/v4/latest/USD";
var currency;
var known_prices = {};

async function get_exchangerate() {
    const result = await $.ajax({
        url: api,
        type: "GET",
    });
    return (currency = result);
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function hasClass(elem, className) {
    return elem.className.split(" ").indexOf(className) > -1;
}

async function create_button() {
    var voided = false;
    while (true) {
        try {
            var cart = document.querySelector(".cart-actions").children;
            if (!voided) {
                //void the current cart
                voided = true;
                $('[data-action="void"]').click();
                //end
            }
            if (cart.length > 0) {
                if (cart[0].querySelector(".canadian-price") == undefined) {
                    const span = document.createElement("button");
                    span.classList.add("btn");
                    span.classList.add("btn-success");
                    span.classList.add("pull-left");
                    span.classList.add("canadian-price");
                    span.innerHTML = "> Canadian Price <";
                    const a = document.createElement("a");
                    a.appendChild(span);
                    cart[0].appendChild(a);
                }
            }
            await sleep(100);
        } catch (error) {
            console.log(error);
            await sleep(100);
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
                    const title = $(product).find('[data-name="title"]').text();

                    if (known_prices[title] == undefined) {
                        //get price
                        const price_usd = $(product).find('[data-numpad="discount"]').val().replace(",", "");
                        const fromRate = currency.rates["USD"];
                        const toRate = currency.rates["CAD"];
                        const price_cad_temp = `${((toRate / fromRate) * price_usd).toFixed(2)}`;
                        known_prices[title] = price_cad_temp
                        //end
                    }

                    const price_cad = known_prices[title];

                    //input top price
                    $(product).find('[name="item_price"]').click();
                    for (let index = 0; index < 15; index++) {
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
                    for (let index = 0; index < 10; index++) {
                        $(`.numpad`).find('[data-key="del"]').click();
                    }
                    for (var i = 0; i < price_cad.length; i++) {
                        $(`.numpad`).find(`[data-key="${price_cad.charAt(i)}"]`).click();
                    }
                    $('[data-key="ret"]').click();
                    $(product).find('[data-action="more"]').children()[0].click();
                    //end
                }
            }
        },
        false
    );
};
