// app.js

const express = require('express');
const app = express();
const axios = require('axios');
const cheerio = require('cheerio');
const projectID = 'hindi-classcentral'
const { Translate } = require('@google-cloud/translate').v2;
const PORT = process.env.PORT || 3000;
const API_KEY = 'AIzaSyCkp0ezhnf5Y7q0Rd7Plju4EQhkrOiyAV4'

const BASE_URL = 'https://www.classcentral.com';

const translate = new Translate({
    projectId:projectID,
    key:API_KEY

});

app.set('view engine', 'ejs');

async function translateAnchorTag($, el) {
    const [translation] = await translate.translate($(el).text(), 'hi');
    $(el).text(translation);
  }
  
  app.get('/', async (req, res) => {

      // fetch the HTML content of the classcentral.com homepage
      const response = await axios.get('https://www.classcentral.com/');
      const html = response.data;
    
      // extract all anchor tags from the HTML content
      const $ = cheerio.load(html);
      const anchorTags = $('a');
    
      // Modify the href attribute of each anchor tag to prepend the base URL
      anchorTags.each((i, el) => {
          const href = $(el).attr('href');
          if (href && href.startsWith('/')) {
            $(el).attr('href', `${BASE_URL}${href}`);
          }
          translateAnchorTag($, el);
        });
    
      // translate the inner text of each anchor tag to Hindi and extract the link from the subpages
      const translations = [];
      for (let i = 0; i < anchorTags.length; i++) {
        const href = anchorTags.eq(i).attr('href');
        let subHtml=''
        if (href && href.startsWith(`${BASE_URL}/`)) {
        try{
          const response = await axios.get(href);
          subHtml = response.data;
        
          const $sub = cheerio.load(subHtml);
          const subTags = $sub('a');
          const subPromises = subTags.toArray().map(async (el) => {
            const subHref = $(el).attr('href');
            if (subHref) {
              const [translation] = await translate.translate($(el).text(), 'hi');
              translations.push({ text: translation, href: subHref });
            }
          });
          await Promise.all(subPromises);
          await new Promise(resolve => setTimeout(resolve, 1000)); // add a 1-second delay to handle the status code 429 error

        } catch(error){
            console.error(`Error fetching ${href}: ${error.message}`);
      // handle the error here, e.g. by logging it or skipping the resource
        }

        } else {
          const innerText = anchorTags.eq(i).text();
          const [translation] = await translate.translate(innerText, 'hi');
          translations.push({ text: translation, href });
        }
      }   
    
      // render the HTML using EJS
      res.render('index', { anchorTags, translations });
    });
    
  
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });