const fs = require("fs");
const got = require("got");
const cheerio = require("cheerio");
const jsonframe = require("jsonframe-cheerio");

const baseUrl = "https://www.divxtotal3.net/peliculas-hd/";
const pageUrl = page => `${baseUrl}/page/${page}`;

async function scrapFilmsList(page = 1) {
  const html = await got(pageUrl(page));
  if (html.body.includes("ERROR 404")) return null;
  const $ = cheerio.load(html.body);
  jsonframe($);

  const filmsListFrame = {
    films: {
      _s: "tr",
      _d: [
        {
          title: "td:nth-child(1) a",
          url: "td:nth-child(1) a @ href",
          generes: "td:nth-child(2) a",
          date: "td:nth-child(3)",
          size: "td:nth-child(4)"
        }
      ]
    }
  };

  return $("tbody").scrape(filmsListFrame);
}

async function scrapeFilm(film) {
  const html = await got(film.url);
  if (html.body.includes("ERROR 404")) return null;
  const $ = cheerio.load(html.body);
  jsonframe($);

  const filmFrame = {
    film: {
      generes: ["p.tagitem + p.orange a"],
      format: ".info-item:nth-child(3) .tagitem + p",
      language: ".info-item:nth-child(6) .tagitem + p",
      torrent: ".orange.text-center a @ href",
        image: ".row:first-child .col-lg-3 img @ src",
      text: ".row:nth-child(6) .col-lg-12 < html",
    }
  };

  const data = $(".panel-body").scrape(filmFrame);
  return { ...film,...data.film };
}

async function run() {
  let page = 1;
  do {
    let films = await scrapFilmsList(page);
    if (films) {
      films = await Promise.all(
        films.films.map(async film => {
          const data = await scrapeFilm(film);
          return data;
        }));
      console.log(films);
      writetoJsonFile(`output/films.json`, films, page > 1);
      page++;
    } else {
      page = films;
    }
  } while (page);
}

run();

const writetoJsonFile = (file_name, data, concat) => {
  let content;
  if (concat && fs.existsSync(`${__dirname}/${file_name}`)) {
    content = JSON.parse(fs.readFileSync(`${__dirname}/${file_name}`, "utf8"));
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
