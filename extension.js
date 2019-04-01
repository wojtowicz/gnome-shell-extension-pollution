const St = imports.gi.St;
const Main = imports.ui.main;
const Soup = imports.gi.Soup;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Clutter = imports.gi.Clutter;
const PanelMenu = imports.ui.panelMenu;

const POLLUTION_URL = 'https://airapi.airly.eu/v2/measurements/installation';
const POLLUTION_AUTH_KEY = 'xxx';
const INSTALLATION_ID = 'xxx';


let _httpSession;
const PollutionIndicator = new Lang.Class({
  Name: 'PollutionIndicator',
  Extends: PanelMenu.Button,

  _init: function () {
    this.parent(0.0, "Pollution Indicator", false);
    this.buttonText = new St.Label({
      text: _("Loading..."),
      y_align: Clutter.ActorAlign.CENTER
    });
    this.actor.add_actor(this.buttonText);
    this._refresh();
  },

  _refresh: function () {
    this._loadData(this._refreshUI);
    this._removeTimeout();
    this._timeout = Mainloop.timeout_add_seconds(800, Lang.bind(this, this._refresh));
    return true;
  },

  _loadData: function () {
    let params = {
      indexType: 'AIRLY_CAQI',
      installationId: INSTALLATION_ID
    };
    _httpSession = new Soup.Session();
    let message = Soup.form_request_new_from_hash('GET', POLLUTION_URL, params);
    message.request_headers.append("apikey", POLLUTION_AUTH_KEY);
    _httpSession.queue_message(message, Lang.bind(this, function (_httpSession, message) {
          if (message.status_code !== 200)
            return;
          let json = JSON.parse(message.response_body.data);
          this._refreshUI(json);
        }
      )
    );
  },

  _refreshUI: function (data) {
    let txt = '';
    let values = data.current.values;
    for (let i = 0; i < values.length; i++) {
      if (values[i].name == 'PM25')
        txt += values[i].name + ' ' + Math.floor(values[i].value * 100 / 25) + '% ';
      if (values[i].name == 'PM10')
        txt += values[i].name + ' ' + Math.floor(values[i].value * 100 / 50) + '% ';
    }
    this.buttonText.set_text(txt);
    this.buttonText.set_style('color:' + data.current.indexes[0].color);
  },

  _removeTimeout: function () {
    if (this._timeout) {
      Mainloop.source_remove(this._timeout);
      this._timeout = null;
    }
  },

  stop: function () {
    if (_httpSession !== undefined)
      _httpSession.abort();
    _httpSession = undefined;

    if (this._timeout)
      Mainloop.source_remove(this._timeout);
    this._timeout = undefined;

    this.menu.removeAll();
  }
});

let twMenu;

function init() {
}

function enable() {
  twMenu = new PollutionIndicator;
  Main.panel.addToStatusArea('pollution-indicator', twMenu);
}

function disable() {
  twMenu.stop();
  twMenu.destroy();
}
