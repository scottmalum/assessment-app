
const axios = require('axios');
const { join } = require("path");
require("dotenv").config();

class EasycronApi
{

   constructor(token){
        this.uri = process.env.EASYCRON_URL;
        this.ex = process.env.EASYCRON_EXTERNAL_URL;
        this.token = token ? token : process.env.EASYCRON_TOKEN;
    }

     call(method, data){
        data['token'] = this.token;
        let a = [];
        for (const key in data) {
          if (data.hasOwnProperty(key)) {
            const value = data[key];
            a.push(key + '=' + encodeURI(value));
          }
        }        
        let temp = a.join('&');
        let url = this.uri + method + '?' + temp;
        axios.get(url).then(resp => {
          return resp.data;
        });
    }
}


module.exports = {
  EasycronApi
};