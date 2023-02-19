const express = require('express');
const app = express();
const axios = require('axios');
const cheerio = require('cheerio');
const projectID = 'hindi-classcentral'
const { Translate } = require('@google-cloud/translate').v2;
require('dotenv').config();
//const API_KEY = 'AIzaSyCkp0ezhnf5Y7q0Rd7Plju4EQhkrOiyAV4'
const { API_KEY} = process.env;

const BASE_URL = 'https://www.classcentral.com';

const translate = new Translate({
    projectId:projectID,
    key:API_KEY

});

app.set('view engine', 'ejs');


app.get('/', async (req, res) => {
  // fetch the HTML content of the classcentral.com homepage
  const response = await axios.get('https://www.classcentral.com/');
  const html = response.data;

  // extract all anchor tags from the HTML content
  const $ = cheerio.load(html);
  const anchorTags = $('a');

  // translate the inner text of each anchor tag to Hindi
  const translations = [];
  for (let i = 0; i < anchorTags.length; i++) {
    const innerText = anchorTags.eq(i).text();
    const [translation] = await translate.translate(innerText, 'hi');
    translations.push(translation);
  }   
  
    // replace the href attribute with the full URL, this solve the proble of having the links as localhost:3000/rankings as opposed to https://classcentral.com/rankings

  anchorTags.each((i, el) => {
    const href = $(el).attr('href');
    if (href && href.startsWith('/')) {
      $(el).attr('href', `${BASE_URL}${href}`);
    }
  });


  // render the HTML using EJS
  res.render('index', { anchorTags, translations });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});