
const fs = require('fs');
const path = require('path');
const {google} = require('googleapis');


class GoogleHandler {
  constructor(edge) {

    this.edge = edge
    this.tableId = '17yJOdz9ahYAH2IK32javOGnQh11cLUPdztfm4diqxMs';

  }

  async init() {
    let credits = await this.edge.get('login', 'google', {_id: 'login'}).then(n => n[0])
    this.auth = new google.auth.GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      credentials: credits
    })

    this.client = await this.auth.getClient()

    this.sheets = google.sheets({ version: 'v4', auth: this.client})
  }


  async write(auth, data) {}
    

}

module.exports = GoogleHandler