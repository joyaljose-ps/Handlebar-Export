const puppeteer = require("puppeteer");

const fs = require("fs-extra");

const Handlebars = require("handlebars");

const path = require("path");

const data = require('./data2.json');

const compile = async function (templateName, data) {
    const filePath = path.join(process.cwd(), 'templates', `${templateName}.hbs`);
    const html = await fs.readFile(filePath, 'utf8');

    const partialsPath = path.join(process.cwd(), 'partials', 'controls.hbs');
    const partialHtml = await fs.readFile(partialsPath, 'utf8');

    const pluginsPartialPath = path.join(process.cwd(), 'partials', 'plugins.hbs');
    const pluginsPartialHtml = await fs.readFile(pluginsPartialPath, 'utf8');

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

    Handlebars.registerPartial('recursiveControls', partialHtml);

    Handlebars.registerPartial('recursivePlugins', pluginsPartialHtml)

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
            margin: {
                top: '10mm',
                bottom: '10mm',
                left: '10mm',
                right: '10mm',
            },
            printBackground: true
        })

        console.log("done creating pdf");

        await browser.close();

        process.exit();

    } catch (e) {
        console.log(e);
    }

})();