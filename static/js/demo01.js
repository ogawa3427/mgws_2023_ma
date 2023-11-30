// demo01.js

// First version: Thu Jul 13 21:38:56 JST 2023
// prev update: Mon Jul 17 17:39:07 JST 2023
// New version: Sat Aug 12 09:06:05 JST 2023
// Last update: Fri Nov 17 07:56:35 JST 2023

// See also:
// https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Date/Date
// https://beta-notes.way-nifty.com/blog/2020/03/post-ebcf2e.html for websocket related codings
// https://www.nishishi.com/javascript-tips/realtime-clock-setinterval.html   
// https://web-dev.tech/front-end/javascript/digital-clock/


// -----------------------------------------------------------------------------

//
// We can set NTPoffset by using MQTT over websocket
//
// message format: "offset = value" 
//
// The value is the number of seconds expressed in fixed-point format
// The value must be negative if the result of ntpdate is negative.
//
//  $ ntpdate -q ntp.nict.jp 2> /dev/null               |
//    egrep 'adjust time server'                        |
//    tail -1                                           |        
//    sed -e 's/^.*offset //'                           |
//    awk '{printf "offset = %5.3f\n", $1; fflush()}'   |
//    mosquitto_pub -l -t mgwsTEST-Q999//wstest01 -h broker.hivemq.com
//

// -----------------------------------------------------------------------------

const WSURL = 'ws://broker.hivemq.com:8000/mqtt'
// const WSURL = 'wss://broker.hivemq.com:8004/mqtt'
// const WSURL = 'ws://test.mosquitto.org:8081'

const MQTTtopic = 'mgwsPROD-Q101/prod1130'

// -----------------------------------------------------------------------------

var intervalID = 0
var ntpOffset = 0

var data1 = 0
var data2 = 0
var data3 = 0

// -----------------------------------------------------------------------------

// setZero2() - zero padding (for two digits)
// setZero3() - zero padding (for three digits)

function setZero2(x) {
    var _ret = x
    if (x < 10) { _ret = "0" + _ret }
    return _ret
}

function setZero3(x) {
    var _ret = x
    if (x < 100) { _ret = "0" + _ret }
    if (x < 10)  { _ret = "0" + _ret } 
    return _ret
}

// -----------------------------------------------------------------------------

// showData() - display digital clock

function showData() {
    var _Time0  = Date.now()
    var _nowTime  = new Date(_Time0 + (ntpOffset * 1000)) ; // Date(_nowMillisec)
    var _dow3 = new Array("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat")

    var _nowYear  = setZero2(_nowTime.getFullYear())
    var _nowMonth = setZero2(_nowTime.getMonth()+1)
    var _nowDate  = setZero2(_nowTime.getDate())
    var _nowDow   = _nowTime.getDay()
    var mesgDate = _nowYear + "-" + _nowMonth + "-" + _nowDate + "(" + _dow3[_nowDow] + ")"
    
    var _nowHour  = setZero2(_nowTime.getHours())
    var _nowMin   = setZero2(_nowTime.getMinutes())
    var _nowSec   = setZero2(_nowTime.getSeconds())
    var _nowMsec  = setZero3(_nowTime.getMilliseconds())
    var mesgTime1 = _nowHour + ":" + _nowMin + ":" + _nowSec
    var mesgTime2 = "." + _nowMsec
    var mesgTime = mesgTime1 + mesgTime2

    var _timeOffset = _nowTime.getTimezoneOffset()
    var mesgTimeOffset = "UTC"
    if (_timeOffset > 0) {
        mesgTimeOffset = mesgTimeOffset + "+" + _timeOffset/60
    } else if (_timeOffset < 0) {
        mesgTimeOffset = mesgTimeOffset + "" + _timeOffset/60
    }

    document.getElementById("RealtimeDataDisplayArea0").innerHTML = (mesgDate + " " + mesgTime)
    document.getElementById("RealtimeDataDisplayArea1").innerHTML = "Data1:" + data1;
    document.getElementById("RealtimeDataDisplayArea2").innerHTML = "Data2:" + data2;
    document.getElementById("RealtimeDataDisplayArea3").innerHTML = "Data3:" + data3;
    // /console.log(mesgDate + " " + mesgTime);
    // console.log(data1 + " / " + data2 + " / " + data3);
    // console.log("----")
    document.querySelector(".data1").innerText = data1
    document.querySelector(".data2").innerText = data2 
    document.querySelector(".data3").innerText = data3
    document.querySelector(".data0").innerText = (mesgDate + " " + mesgTime)
}

// -----------------------------------------------------------------------------

// mouseDown()   - mouse button pressed
// mouseUp()     - mouse button released
// buttonClock() - mouse button clicked

function mouseDown() {
    // console.log("mouseDown()")
    clearInterval(intervalID)
    console.log("clock stopped.")
}

function mouseUp() {
    // console.log("mouseUp()")
    console.log("clock restarted.")
    syncTime()
}

function buttonClick() {
    // console.log("buttonClick()")
}

// -----------------------------------------------------------------------------

// syncTime() - wait for several sub-seconds to synchronize time

function syncTime() {
    var _Time0 = Date.now()
    var currentTime = new Date(_Time0 + (ntpOffset * 1000)) 
    var delay_msec = 1000 - currentTime.getMilliseconds()
    if (delay_msec < 50) { delay_msec += 1000 }
    // delay_msec -= 10; // offset
    console.log("Waiting for " + delay_msec + "msec.")
    clearInterval(intervalID)
    setTimeout(startData, delay_msec)
}

// -----------------------------------------------------------------------------

// startData() - start calling showData(). It will be called every 1sec.

function startData() {
    intervalID = setInterval('showData()', 1000)
    console.log("Let's go by startData()")
}

// -----------------------------------------------------------------------------

// var consout = 'MQTT over WebSockets Test'+'<br>'
// document.body.innerHTML = consout

var client = mqtt.connect(WSURL)

client.subscribe(MQTTtopic) // subscribe Topic

client.on('message', function(topic, payload) {
    console.log("topic=[" + topic + "] payload=[" + payload + "]")
        var _text = payload.toString()

	// in case of "keys = value"
        var _words = _text.split('=') //(/[ \t]/)
        var _key = _words[0].trim()
        var _val = _words[1]
        if (_key == "offset") {
            var _newOffset = Number(_val.trim().split(' ')[0])
            if (_newOffset != ntpOffset) {
                ntpOffset = _newOffset
                syncTime()
            }
            _mesg = "key=[" + _key + "] val=[" + _val + "] -> ntpOffset=[" + ntpOffset + "]"
            console.log(_mesg)

        } else {
	// in case of "val1 val2 val3"
            var _vals = _text.trim().split(/[ \t]/)
            var _n = _vals.length;
            if (_n >= 1) {data1 = _vals[3]}
            if (_n >= 2) {data2 = _vals[4]}
            if (_n >= 3) {data3 = _vals[5]}
            _mesg = "_vals=[" + _vals + "]"
            console.log(_mesg)
	}
    }
)

// -----------------------------------------------------------------------------

var button = document.getElementById("button")
button.addEventListener('mousedown', mouseDown)
button.addEventListener('mouseup', mouseUp)
button.addEventListener('click', buttonClick)

showData()
syncTime()

// -----------------------------------------------------------------------------
