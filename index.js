const Plugin = require('./lib/plugin.js');
const Xiaomi = require('./lib/xiaomi');
const { getDeviceValue, getDeviceAction } = require('./lib/utils');

const plugin = new Plugin();

let channelsList = [];
let debug = false;


plugin.on('params', params => {
  start(params);
});

plugin.on('channels', channels => {
  // console.log(channels);
});

plugin.on('debug', mode => {
  debug = mode;
});

function getChanel(sid, desc) {
  return { id: `${desc}_${sid}`, desc };
}

function getChanelList(device) {
  return Object.keys(device.props)
      .filter(key => device.props[key] && device.props[key].type !== 'ext')
      .map(key => getChanel(device.sid, device.props[key].alias));
}

function getChanelData(sid, props, data) {
  const ext =  Object.keys(data)
    .filter(key => props[key] && props[key].type === 'ext')
    .reduce((l, n) => Object.assign({}, l, { [props[n].alias]: getDeviceValue(data[n]) }), {})

  return Object.keys(props)
    .filter(key => props[key].type !== 'ext')
    .map(key => {
      if (data[key]) {
        return { id: `${props[key].alias}_${sid}`, value: getDeviceValue(data[key]), ext  }
      }
      return { id: `${props[key].alias}_${sid}`, ext  }
    });
}

function start(options) {
  const xiaomi = new Xiaomi(options);

  xiaomi.on('message', data => {
    if (debug) {
      plugin.debug(data);
    }
  });

  xiaomi.on('send', data => {
    if (debug) {
      plugin.debug(data);
    }
  });


  xiaomi.on('device', device => {
    plugin.setChannels(getChanelList(device));
    plugin.setChannelsData(getChanelData(device.sid, device.props, device.data));
  });

  xiaomi.on('data', device => {
    plugin.setChannelsData(getChanelData(device.sid, device.props, device.data));
  });

  plugin.on('actions', data => {
    data.forEach(item => {
	     const temp = item.id.split('_');

  	  if (temp.length > 2) {
  	   var id = temp[temp.length - 1];
  	   var alias = temp.slice(0, temp.length - 1).join('_');
  	  } else {
  	   var id = temp[1];
  	   var alias = temp[0];
  	  }

      const value = item.value;
      const command = item.command;

      switch (command) {
        case 'on':
          xiaomi.sendAction(getDeviceAction(id, alias, ['on']));
          break;
        case 'off':
          xiaomi.sendAction(getDeviceAction(id, alias, ['off']));
          break;
        default:
      }
    });
  });
}
