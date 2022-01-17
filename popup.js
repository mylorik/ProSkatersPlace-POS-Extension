var browser = browser || chrome;


var percentage_offset = 0;
init_from_storage();

function load_default_configuration() {
    set_storage('first_run', true);
    set_storage('percentage_offset', 3);
}


function init_from_storage() {
    browser.storage.sync.get(null, async function (items) {
        if (items['first_run'] === undefined) {
            load_default_configuration();
        }
        percentage_offset = await get_storage('percentage_offset');

        main();
    });
}


async function get_storage(index) {
    try {
        return new Promise(function (resolve, reject) {
            browser.storage.sync.get(index, function (recipes) {
                resolve(recipes[index]);
            });
        });
    }
    catch (err) {
        return "Unknown";
    }
}

function set_storage(index, key) {
    try {
        browser.storage.sync.set({ [index]: key }, function () {
        });
    }
    catch (err) {
        console.log(err);
    }
}


async function constructForm() {
    //percentage_offset
    var destination = document.createElement("p");
    document.getElementsByClassName("content")[0].appendChild(destination);
    var label = document.createElement('label');
    label.htmlFor = "percentage_offset";
    label.appendChild(document.createTextNode('Percentage Offset %: '));
    var input = document.createElement("INPUT");
    input.setAttribute("type", "number");
    input.setAttribute("id", "percentage_offset");
    input.value = percentage_offset;
    input.classList.add("percentage_offset");

    destination.appendChild(label);
    destination.appendChild(input);
}


async function eventConstructForm() {
    document.querySelector('.percentage_offset').addEventListener('change', (event) => {
        var value = parseInt(event.target.value);
        if (value > 100) {
            value = 100;
        }
        if (value < 0) {
            value = 0;
        }
        set_storage('percentage_offset', value);
    });
}

async function main() {
    await constructForm();
    await eventConstructForm();
}

