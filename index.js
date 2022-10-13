const puppeteer = require("puppeteer");

const fs = require("fs-extra");

const Handlebars = require("handlebars");

const path = require("path");

const data = require('./data.json');

const compile = async function (templateName, data) {
    const filePath = path.join(process.cwd(), 'templates', `${templateName}.hbs`);
    const html = await fs.readFile(filePath, 'utf8');

    Handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
        return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
    });
    Handlebars.registerHelper('ifNotEquals', function (arg1, arg2, options) {
        return (arg1 !== arg2) ? options.fn(this) : options.inverse(this);
    });

    Handlebars.registerHelper('percentage', function (partial, total) {
        if (!total) return 0;
        return ((partial / total) * 100).toFixed(2);
    });

    Handlebars.registerHelper("progressColor", function (arg, options) {
        if (arg < 25) {
            return '#FF0F00'
        } else if (arg < 50) {
            return '#FF7020'
        } else if (arg < 75) {
            return '#FFCC16'
        } else {
            return '#17A500';
        }
    });


    Handlebars.registerHelper("passedChecks", function (controls) {
        return Object.keys(controls).filter(
            key => (controls[key].pass || 0) > 0
        ).length;
    });

    Handlebars.registerHelper("objectLength", function (arg) {
        return Object.keys(arg).length;
    });

    Handlebars.registerHelper("sum", function (lvalue, rvalue) {
        lvalue = parseFloat(lvalue);
        rvalue = parseFloat(rvalue);
        return lvalue + rvalue;
    });

    Handlebars.registerHelper("pluginCount", function (arg) {
        var pluginCounter = function (controls) {
            var pluginCount = 0;
            Object.values(arg).map(item => {
                if (!item.controls && item.pluginCount) {
                    pluginCount += item.plugins.length
                } else if (item.controls && !item.pluginCount) {
                    pluginCount += pluginCounter(item.controls);
                }
            })
            return pluginCount;
        }
        return pluginCounter(arg);
    });

    Handlebars.registerHelper("passedCheckText", function (arg) {
        if (arg.pluginCount === 0) {
            return "N/A";
        } else if (arg.pass + arg.fail === 0) {
            return "No Resources";
        } else if (arg.fail === 0) {
            return "Pass";
        } else {
            return "Fail";
        }
    });

    Handlebars.registerHelper("passedCheckClass", function (arg) {
        if (arg.pluginCount === 0) {
            return "defaultPassCheck"
        } else if (arg.pass + arg.fail === 0) {
            return "defaultPassCheck"
        } else if (arg.fail === 0) {
            return "pass"
        } else {
            return "fail"
        }
    });

    Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {

        switch (operator) {
            case '==':
                return (v1 == v2) ? options.fn(this) : options.inverse(this);
            case '===':
                return (v1 === v2) ? options.fn(this) : options.inverse(this);
            case '!=':
                return (v1 != v2) ? options.fn(this) : options.inverse(this);
            case '!==':
                return (v1 !== v2) ? options.fn(this) : options.inverse(this);
            case '<':
                return (v1 < v2) ? options.fn(this) : options.inverse(this);
            case '<=':
                return (v1 <= v2) ? options.fn(this) : options.inverse(this);
            case '>':
                return (v1 > v2) ? options.fn(this) : options.inverse(this);
            case '>=':
                return (v1 >= v2) ? options.fn(this) : options.inverse(this);
            case '&&':
                return (v1 && v2) ? options.fn(this) : options.inverse(this);
            case '||':
                return (v1 || v2) ? options.fn(this) : options.inverse(this);
            default:
                return options.inverse(this);
        }
    });

    console.log(html)
    return Handlebars.compile(html)(data);
};

(async function () {

    try {

        const browser = await puppeteer.launch({
            executablePath: '/opt/homebrew/bin/chromium'
        });

        const page = await browser.newPage();

        console.log(data)

        const content = await compile('index', data);

        console.log(content)

        await page.setContent(content);

        await page.pdf({
            path: 'output.pdf',
            format: 'A4',
            printBackground: true
        })

        console.log("done creating pdf");

        await browser.close();

        process.exit();

    } catch (e) {
        console.log(e);
    }

})();