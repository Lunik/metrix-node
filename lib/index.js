var Config = require('../config/config.json')

var os = require('os')
var io = require('socket.io-client')
var speedTest = require('speedtest-net')

var MASTER = Config.master
MASTER.host = process.env.HOST || MASTER.host
MASTER.port = process.env.PORT || MASTER.port

MASTER.toString = function () {
  return this.host + ':' + this.port
}

var NODE = {
  'speed': {
    'up': 0,
    'down': 0
  }
}

var socket = io('http://' + MASTER.host + ':' + MASTER.port)

socket.on('connect', function () {
  console.log('Connected to ' + MASTER.toString())
  socket.emit('hostname', os.hostname().replace(/\./g, '-'))
})

socket.on('disconnect', function () {
  console.log('Disconnected from ' + MASTER.toString())
})

// When Master pull stats
socket.on('info', function () {
  console.log('Push stats to ' + MASTER.toString())
  NODE = {
    'lastPush': (new Date()).getTime(),
    'hostname': os.hostname().replace(/\./g, '-'),
    'os': {
      'name': os.type(),
      'platform': os.platform(),
      'arch': os.arch(),
      'release': os.release()
    },
    'cpu': {
      'type': os.cpus()[0].model,
      'core': os.cpus().length,
      'speed': os.cpus()[0].speed
    },
    'mem': {
      'total': os.totalmem(),
      'free': os.freemem()
    },
    'loadavg': {
      '1m': os.loadavg()[0],
      '5m': os.loadavg()[1],
      '15m': os.loadavg()[2]
    },
    'interfaces': os.networkInterfaces(),
    'uptime': os.uptime(), // s
    'speed': NODE.speed
  }
  socket.emit('info', NODE)
})

// Exectute speed test
myInterval(speed, Config.node.speedTestInterval)

function speed () {
  var test = speedTest({maxTime: 5000})

  test.on('data', function (data) {
    NODE.speed = {
      'up': data.speeds.upload, // mb/s
      'down': data.speeds.download // mb/s
    }
  })

  test.on('error', function (err) {
    console.error(err)
  })
}

function myInterval (fn, t) {
  fn()
  return (setInterval(fn, t))
}
