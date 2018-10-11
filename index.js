const fs = require("fs");
const got = require("got");
const cheerio = require("cheerio");
const jsonframe = require("jsonframe-cheerio");

const baseUrl = 'https://www.divxtotal3.net/peliculas-hd/';
const pageUrl = (page) => `${baseUrl}/page/${page}`;

async function scrapFilms(page = 1) {
  const html = await got(pageUrl(page));
  if (html.body.includes('ERROR 404'))
    return null;
  const $ = cheerio.load(html.body);
  jsonframe($);

  const filmsFrame = {
    films: {
      _s: "tr",
      _d: [
        {
          title: {
            _s: "td:nth-child(1)",
            _d: {
              title: "a",
              url: " a @ href"
            }
          },
          genere: "td:nth-child(2) a",
          date: "td:nth-child(3)",
          size: "td:nth-child(4)"
        }
      ]
    }
  };

    return $("tbody").scrape(filmsFrame);
}

async function run() {
    let page = 1;
    do {
        const films = await scrapFilms(page);
        if (films) {
            console.log(films);
            writetoFile(`output/films.json`, films.films, page > 1);
            page++;
        } else {
            page = films;
        } 
    } while (page);
}

run();


const writetoFile = (file_name, data , concat) => {
    let content;
    if (concat && fs.existsSync(`${ __dirname }/${ file_name }`)) {
        content = JSON.parse(fs.readFileSync(`${__dirname}/${file_name}`, 'utf8'));
        content.push(data);
    } else {
        content = data;
    }
    fs.writeFile(
        `${__dirname}/${file_name}`,
        JSON.stringify(content, null, 4),
        "utf8",
        err => {
            if (err) {
                return console.log(err);
            }
            console.log(`JSON ${file_name} saved correctly`);
        }
    );
};
