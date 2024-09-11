
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
      scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/calendar.readonly'],
      credentials: credits
    })

    this.client = await this.auth.getClient()

    this.sheets = google.sheets({ version: 'v4', auth: this.client})
    this.calendar = google.calendar({version: 'v3', auth: this.client});

    this.edgeCal = await this.edge.get('login', 'google', {_id: 'edgeCal'}).then(n => n[0].value)
    this.spiritIds = await this.edge.get('login', 'google', {_id: 'spiritIds'}).then(n => n[0].value)
    this.spiritMaster = await this.edge.get('login', 'google', {_id: 'spiritIds'}).then(n => n[0].master)


    let oddily_credits = await this.edge.get('login', 'google', {_id: 'login_oddily'}).then(n => n[0])

    //this.oddily_auth = new google.auth.OAuth2(
    //  oddily_credits.new_id,
    //  oddily_credits.new_secret,
    //  'YOUR_REDIRECT_URL'
    //);
 
/*
    this.oddily_auth = new google.auth.GoogleAuth({
      scopes: ['https://mail.google.com/'],
      credentials: oddily_credits
      
    })
    this.oddily_token = await this.oddily_auth.getAccessToken();

    this.client_oddily = await this.oddily_auth.getClient()

    this.gmail = google.gmail({version: 'v1', auth: this.client_oddily});
    */
/*
    const JWT = google.auth.JWT;
      const authClient = new JWT({
        credentials: oddily_credits,
        keyFile: path.join(__dirname, './keys.json'),
        scopes: ['https://mail.google.com/'],
        subject: 'poletime.bot@gmail.com'
      });

     await authClient.authorize(); // once authorized, can do whatever you want

      this.gmail = google.gmail({
        auth: authClient,
        version: 'v1'
      });
*/
  }


  async getSheet(name) {
    let result = await this.sheets.spreadsheets.get({
      auth: this.auth,
      spreadsheetId: this.tableId,
    });
    return result.data.sheets.find(n => n.properties.title == name.replaceAll(':', '|').replaceAll('!', '|'))?.properties
  }

  async createSheet(event) {

    let color = {
      hlasovani: {
        "red": 1,
        "green": 25,
        "blue": 250,
        "alpha": 100
      },
      form: {
        "red": 30,
        "green": 144,
        "blue": 255,
        "alpha": 100
      },
    }
    let result = await this.sheets.spreadsheets.batchUpdate({
      auth: this.auth,
      spreadsheetId: this.tableId,
      resource: {
        requests: [
          {
            addSheet: {
              properties: {
                title: (event.name ? (`${event.name} - ${new Date(event.created).toLocaleString('cs-CZ')}`) : event._id).replaceAll(':', '|').replaceAll('!', '|'),
                index: 1,
                tabColorStyle: {
                  rgbColor: color[event.type]
                },
                gridProperties: {
                  
                }
            }
          }
        }
        ]
      }
    })
    return result.data.replies[0].addSheet.properties
  }

  async deleteSheet(sheet) {
    let result = await this.sheets.spreadsheets.batchUpdate({
      auth: this.auth,
      spreadsheetId: this.tableId,
      resource: {
        requests: [
          {
            deleteSheet: {
              sheetId: sheet.sheetId,
          }
        }
        ]
      }
    })
    return result
  }

  async clearSheet(sheet) {
    await this.sheets.spreadsheets.values.clear({
      auth: this.auth,
      spreadsheetId: this.tableId,
      range: sheet.title
    })
  }

  async postSheet(sheet, data) {
    let result = await this.sheets.spreadsheets.values.append({
      auth: this.auth,
      spreadsheetId: this.tableId,
      range: sheet.title,
      valueInputOption: 'RAW', // USER_ENTERED
      resource: {
        values: data
      }
    })
  }

  async nahratData(event, options) {

    let guild = options.guild
    if (!guild) return false
    let nahrat = [[]]

    if (event.type == 'hlasovani') {
      let answers = event.answers.split('|').map((n, i) => {
        let name = event[n].map(a => event.mode == 'team' ? guild.roles.cache.get(a).name : (guild.members.cache.get(a).nickname || guild.members.cache.get(a).user.username))
        return { name: name, s: i }
      })
  
      let l = 0
      for (let a of answers) { if (l < a.name.length) l = a.name.length }
  
      let format = []
      for (let i = 0; i < l; i++) {
        let push = []
      
        for (let a = 0; a < answers.length; a++) {
          push[a] = answers[a].name[i] || ''
        }
        format.push(push)
      }
  
      nahrat = [
        event.answers.split('|'),
        ...format
      ]
    } else if (event.type == 'form') {
      let header = ["Date", "Tým", ...event.questions]
      let main = event.Accept.map(n => {
        let date = new Date(n.time).toLocaleString('cs-CZ')
        let name = event.mode == 'team' ? guild.roles.cache.get(n.id).name : (guild.members.cache.get(n.id).nickname || guild.members.cache.get(n.id).user.username)
        let data = [date, name, ...Object.values(n.answers)]
        return data
      })
      nahrat = [
        header,
        ...main
      ]
    }


    let sheet = await this.getSheet(event.name ? (`${event.name} - ${new Date(event.created).toLocaleString('cs-CZ')}`) : event._id)
    if (!sheet) sheet = await this.createSheet(event)
    await this.clearSheet(sheet)
    await this.postSheet(sheet, nahrat)
  }

  async getTable(tableId) {
    let result = await this.sheets.spreadsheets.get({
      auth: this.auth,
      spreadsheetId: tableId,
    });
    return result.data//.find(n => n.properties.title == name.replaceAll(':', '|').replaceAll('!', '|'))?.properties
  }

  async getTableData(tableId, range) {
    let result = await this.sheets.spreadsheets.values.get({
      auth: this.auth,
      spreadsheetId: tableId,
      range: range
    })
    return result.data.values
  }

  async duplicateTable(tableId, data) {
    let result = await this.sheets.spreadsheets.batchUpdate({
      auth: this.auth,
      spreadsheetId: tableId,
      resource: {
        requests: [
          {
            duplicateSheet: {
              insertSheetIndex: data.index,
              newSheetId: data.id,
              newSheetName: data.name,
              sourceSheetId: data.source
            }
          }
        ]
      }
    })
    return result.data.replies[0].duplicateSheet.properties
  }

  async copyTo(copyFrom, sheetId, copyTo, data) {
    let sheet = await this.sheets.spreadsheets.sheets.copyTo({
      auth: this.auth,
      spreadsheetId: copyFrom,
      sheetId: sheetId,
      destinationSpreadsheetId: copyTo
    }).then(n => n.data)
    
    // DUPLICATE AND DELETE HERE

     let result = await this.sheets.spreadsheets.batchUpdate({
      auth: this.auth,
      spreadsheetId: copyTo,
      resource: {
        requests: [
          {
            duplicateSheet: {
              insertSheetIndex: data.index,
              newSheetId: data.id,
              newSheetName: data.name,
              sourceSheetId: sheet.sheetId
            }
          },
          {
            deleteSheet: {
              sheetId: sheet.sheetId
            }
        }
        ]
      }
    })
    return result.data.replies[0].duplicateSheet.properties
  }

  async getCalendar(id, max = 2) {
    const res = await this.calendar.events.list({
      calendarId: id,
      timeMin: new Date().toISOString(),
      maxResults: max,
      singleEvents: true,
      orderBy: 'startTime',
    })
    return res.data.items;
  }

  async fetchCalendar(calendar, event) {
    const res = await this.calendar.events.get({
      calendarId: calendar,
      eventId: event
    })
    return res.data;
  }

  async getEmails() {
    const res = await this.gmail.users.messages.list({
      userId: "me",
      //maxResults: 10,
      //token: this.oddily_token,
      //q: "is:unread" // to:oddily@frisbee.cz  to:oddily@czechultimate.cz
    });
 
    const messages = res.data.messages;

    console.log(messages)
    return res.data;
  }
    

}

module.exports = GoogleHandler