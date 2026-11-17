// Case Zero wiring map and starter code. Brain: Raspberry Pi Pico family (Pico, Pico W, Pico 2: same pins).
// planWiring() gives every part its pins by the real rules; codeFor() writes a CircuitPython code.py from that plan.
// Every press and turn prints a line like "NOCIV B1 1" so a live test can read it later over USB.
// The Pico's own small light also turns on with a press, so a part can be tested with no screen and no computer.
// A screen that is not connected yet never stops the code: its setup sits in one try.

// The Pico header, top to bottom. Left side is pins 1 to 20, right side is pins 40 to 21.
export const PICO_LEFT = ['GP0', 'GP1', 'GND', 'GP2', 'GP3', 'GP4', 'GP5', 'GND', 'GP6', 'GP7', 'GP8', 'GP9', 'GND', 'GP10', 'GP11', 'GP12', 'GP13', 'GND', 'GP14', 'GP15'];
export const PICO_RIGHT = ['VBUS', 'VSYS', 'GND', '3V3_EN', '3V3', 'ADC_VREF', 'GP28', 'AGND', 'GP27', 'GP26', 'RUN', 'GP22', 'GND', 'GP21', 'GP20', 'GP19', 'GP18', 'GND', 'GP17', 'GP16'];
const ADC = [26, 27, 28];
const ALL = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 26, 27, 28];
export const PICO_PINS = ALL;
export const PICO_BRAINS = ['pico', 'picow'];
// Every brain the wiring plan knows: its two header rows (top to bottom, USB at the top), the pins a part may use, the analog ones, the SPI and I2C pins,
// a pin's printed name (lab) and its CircuitPython name (cp: null when the board does not run CircuitPython).
const range = (a, b) => { const o = []; for (let i = a; i <= b; i++) o.push(i); return o; };
const PICO_PWM = (n) => (n >> 1) & 7;
export const BOARDS = {
  pico: { name: 'Raspberry Pi Pico', left: PICO_LEFT, right: PICO_RIGHT, all: ALL, adc: ADC, spi: [18, 19, 16], i2c: [4, 5], spiPick: [[17, 20, 21], [22, 16, 15], [14, 13, 12]], camCs: [17, 20, 21, 22], lab: (n) => 'GP' + n, cp: 'board.GP', pwm: PICO_PWM, v5: 'VBUS', v3: '3V3' },
  nano: { name: 'Arduino Nano', left: ['D13', '3V3', 'AREF', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', '5V', 'RST', 'GND', 'VIN'], right: ['D12', 'D11', 'D10', 'D9', 'D8', 'D7', 'D6', 'D5', 'D4', 'D3', 'D2', 'GND', 'RST', 'D0', 'D1'],
    all: range(2, 19), adc: range(14, 21), spi: [13, 11, 12], i2c: [18, 19], spiPick: [[10, 9, 8], [7, 6, 5]], camCs: [10, 9, 8], lab: (n) => (n >= 14 ? 'A' + (n - 14) : 'D' + n), cp: null, pwm: (n) => ([3, 5, 6, 9, 10, 11].indexOf(n) > -1 ? n : -1), v5: '5V', v3: '3V3' },
  promicro: { name: 'Pro Micro (ATmega32U4)', left: ['D1', 'D0', 'GND', 'GND', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9'], right: ['RAW', 'GND', 'RST', 'VCC', 'A3', 'A2', 'A1', 'A0', 'D15', 'D14', 'D16', 'D10'],
    all: [2, 3, 4, 5, 6, 7, 8, 9, 10, 14, 15, 16, 18, 19, 20, 21], adc: [18, 19, 20, 21], spi: [15, 16, 14], i2c: [2, 3], spiPick: [[10, 9, 8], [7, 6, 5]], camCs: [10, 9], lab: (n) => (n >= 18 ? 'A' + (21 - n) : 'D' + n), cp: null, pwm: (n) => ([3, 5, 6, 9, 10].indexOf(n) > -1 ? n : -1), v5: 'VCC', v3: 'VCC' },
  c3: { name: 'ESP32-C3 SuperMini', left: ['5V', 'GND', '3V3', 'GPIO4', 'GPIO3', 'GPIO2', 'GPIO1', 'GPIO0'], right: ['GPIO5', 'GPIO6', 'GPIO7', 'GPIO8', 'GPIO9', 'GPIO10', 'GPIO20', 'GPIO21'],
    all: [5, 6, 7, 10, 20, 21, 0, 1, 2, 3, 4, 8, 9], adc: [0, 1, 2, 3, 4], spi: [4, 6, 5], i2c: [8, 9] /* 8 (the LED) and 9 (BOOT) last */, spiPick: [[7, 10, 3]], camCs: [7, 10], lab: (n) => 'GPIO' + n, cp: 'board.IO', pwm: (n) => n, v5: '5V', v3: '3V3' },
  esp32: { name: 'ESP32 DevKit', left: ['EN', 'GPIO36', 'GPIO39', 'GPIO34', 'GPIO35', 'GPIO32', 'GPIO33', 'GPIO25', 'GPIO26', 'GPIO27', 'GPIO14', 'GPIO12', 'GPIO13', 'GND', 'VIN'], right: ['GPIO23', 'GPIO22', 'TX0', 'RX0', 'GPIO21', 'GPIO19', 'GPIO18', 'GPIO5', 'GPIO17', 'GPIO16', 'GPIO4', 'GPIO2', 'GPIO15', 'GND', '3V3'],
    all: [4, 5, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33], adc: [32, 33, 34, 35, 36, 39], spi: [18, 23, 19], i2c: [21, 22], spiPick: [[5, 17, 16], [15, 4, 2]], camCs: [5, 15], lab: (n) => 'GPIO' + n, cp: 'board.IO', pwm: (n) => n, v5: 'VIN', v3: '3V3' },
  cyd: { name: 'Cheap Yellow Display', left: ['3V3', 'GPIO27', 'GPIO22', 'GND'], right: ['VIN', 'GPIO35', 'GPIO21', 'GND'], all: [22, 27, 21], adc: [35], spi: null, i2c: [27, 22], spiPick: [], camCs: [], lab: (n) => 'GPIO' + n, cp: 'board.IO', pwm: (n) => n, v5: 'VIN', v3: '3V3', builtIn: 'its own 2.8 in touch screen' },
  pi: { name: 'Raspberry Pi (40 pin header)', left: ['3V3', 'GPIO2', 'GPIO3', 'GPIO4', 'GND', 'GPIO17', 'GPIO27', 'GPIO22', '3V3', 'GPIO10', 'GPIO9', 'GPIO11', 'GND', 'ID_SD', 'GPIO5', 'GPIO6', 'GPIO13', 'GPIO19', 'GPIO26', 'GND'], right: ['5V', '5V', 'GND', 'GPIO14', 'GPIO15', 'GPIO18', 'GND', 'GPIO23', 'GPIO24', 'GND', 'GPIO25', 'GPIO8', 'GPIO7', 'ID_SC', 'GND', 'GPIO12', 'GND', 'GPIO16', 'GPIO20', 'GPIO21'],
    all: [4, 17, 27, 22, 5, 6, 13, 19, 26, 23, 24, 25, 12, 16, 20, 21, 18], adc: [], spi: [11, 10, 9], i2c: [2, 3], spiPick: [[8, 25, 24], [7, 23, 22]], camCs: [8, 7], lab: (n) => 'GPIO' + n, cp: null, pwm: (n) => ([12, 13, 18, 19].indexOf(n) > -1 ? n % 2 : -1), v5: '5V', v3: '3V3', pi: true }
};
export const BOARD_OF = { pico: 'pico', picow: 'pico', pico2: 'pico', nano: 'nano', promicro: 'promicro', esp32c3: 'c3', esp32: 'esp32', cyd: 'cyd', zero2: 'pi', pi5: 'pi' };

// What each kind of part needs. d = any pin, a = an analog pin (GP26 to 28), enc = two pins next to each other,
// pwm = a pin whose PWM slice no other sound or motor uses. power: 3V3 or VBUS (5 V from USB).
export const NEED = {
  tact12: { pins: [['press', 'd']], what: 'button' }, button16: { pins: [['press', 'd']], what: 'button' },
  arcade24: { pins: [['press', 'd']], what: 'button' }, arcade30: { pins: [['press', 'd']], what: 'button' },
  dpad: { pins: [['up', 'd'], ['down', 'd'], ['left', 'd'], ['right', 'd']], what: 'button' },
  stick: { pins: [['up', 'd'], ['down', 'd'], ['left', 'd'], ['right', 'd']], what: 'button' },
  pot: { pins: [['turn', 'a']], power: '3V3', what: 'knob' }, slider: { pins: [['slide', 'a']], power: '3V3', what: 'knob' },
  encoder: { pins: [['clk+dt', 'enc'], ['press', 'd']], power: '3V3', what: 'wheel' },
  thumb: { pins: [['x', 'a'], ['y', 'a'], ['press', 'd']], power: '3V3', what: 'stick', opt: ['y'] }, /* opt: left out, not a problem, when the analog pins run out */
  keypad44: { pins: [['row1', 'd'], ['row2', 'd'], ['row3', 'd'], ['row4', 'd'], ['col1', 'd'], ['col2', 'd'], ['col3', 'd'], ['col4', 'd']], what: 'keypad', note: 'Rows and columns: no power wire. The pins read it as a matrix, 16 keys on 8 wires.' },
  mat8: { pins: [['din', 'd'], ['cs', 'd'], ['clk', 'd']], power: 'VBUS', what: 'matrix8', note: 'VCC to VBUS (5 V). DIN, CS and CLK can be any pins.' },
  jack35: { pins: [['audio', 'pwm']], what: 'sound', viaDac: true, note: 'Mono: the pin through a 1K resistor to the tip and ring, a 100 nF capacitor from there to GND, the sleeve to GND.' },
  i2sdac: { pins: [['bclk+lrc', 'enc'], ['din', 'd']], power: 'VBUS', what: 'i2sout', note: 'BCLK and LRC must be side by side (LRC = BCLK + 1). VIN to VBUS (5 V). PCM5102: LOUT, ROUT and AGND go to the jack tip, ring and sleeve.' },
  inmp441: { pins: [['sck+ws', 'enc'], ['sd', 'd']], power: '3V3', what: 'i2sin', note: 'VDD to 3V3, L/R to GND (left channel). SCK and WS side by side (WS = SCK + 1).' },
  led5: { pins: [['light', 'd']], what: 'led', note: 'Put a 220 ohm resistor on the long leg.' },
  ring12: { pins: [['data', 'd']], power: 'VBUS', what: 'ring', note: 'Power from VBUS (5 V). Keep the data wire short.' },
  speaker28: { pins: [['sound', 'pwm']], what: 'sound', note: 'A bare speaker is quiet on a pin. A piezo, or a small amp board (like a PAM8302), is louder.' },
  servo: { pins: [['signal', 'pwm']], power: 'VBUS', what: 'servo', note: 'Power from VBUS (5 V), not 3V3.' },
  tft28: { spi: true, w: 320, h: 240, driver: 'ili9341', what: 'screen' },
  round128: { spi: true, w: 240, h: 240, driver: 'gc9a01', what: 'screen' },
  oled096: { i2c: true, w: 128, h: 64, driver: 'ssd1306', what: 'screen', note: 'Qwiic or STEMMA QT version: one plug, no soldering.' },
  hdmi5: { pi: true }, hdmi7: { pi: true },
  pir: { pins: [['out', 'd']], power: 'VBUS', what: 'motion', note: 'Power it from VBUS (5 V). Its OUT pin gives 3.3 V, safe for the Pico. The two small screws set the range and how long it stays on.' },
  vl53: { i2c: true, what: 'distance', note: 'Shares the two I2C wires with any other I2C part. Most VL53L0X boards take 3V3.' },
  arducam: { cam: true, what: 'camera', note: 'SPI carries the picture (it needs MISO too), I2C sets the camera up. VCC to 3V3.' }
};
const slice = (n) => (n >> 1) & 7;

// items: [{ key, label, type }] in number order. over: { 'key:role': pin } her own choices win.
export function planWiring(items, over, B) {
  B = B || BOARDS.pico; const ALLB = B.all, ADCB = B.adc, L = B.lab, sp = B.spi || [], ic = B.i2c || [];
  const used = {}, rows = [], problems = [], pwmSlices = {};
  const take = (pin, who) => { if (used[pin] && used[pin] !== who) problems.push(L(pin) + ' is used twice (' + used[pin] + ' and ' + who + ').'); used[pin] = who; };
  const free = (p) => used[p] == null;
  const firstFree = (list) => list.find(free);
  if (!B.spi) items.filter((i) => NEED[i.type] && (NEED[i.type].spi || NEED[i.type].cam)).forEach((i) => problems.push(i.label + ' needs SPI, and the ' + B.name + ' has no free SPI pins.' + (B.builtIn ? ' Its SPI drives ' + B.builtIn + '.' : '')));
  const spiParts = !B.spi ? [] : items.filter((i) => NEED[i.type] && NEED[i.type].spi), i2cParts = items.filter((i) => NEED[i.type] && NEED[i.type].i2c);
  // 1. screens first: they need fixed pins. SPI0 = GP18 clock, GP19 data. I2C0 = GP4 SDA, GP5 SCL.
  const camParts = !B.spi ? [] : items.filter((i) => NEED[i.type] && NEED[i.type].cam);
  if (spiParts.length || camParts.length) { take(sp[0], 'SPI (clock)'); take(sp[1], 'SPI (data)'); }
  if (i2cParts.length || camParts.length) { take(ic[0], 'I2C (SDA)'); take(ic[1], 'I2C (SCL)'); }
  if (camParts.length) take(sp[2], 'SPI (camera MISO)');
  camParts.forEach((it) => { const k = it.key + ':cs', pin = over[k] != null ? over[k] : B.camCs.find(free) != null ? B.camCs.find(free) : firstFree(ALLB.filter((x) => ADCB.indexOf(x) < 0)); if (pin != null) take(pin, it.label);
    rows.push({ it, roles: [{ role: 'clock', pin: sp[0], fixed: true }, { role: 'data', pin: sp[1], fixed: true }, { role: 'miso', pin: sp[2], fixed: true }, { role: 'cs', pin, kind: 'd', k }, { role: 'SDA', pin: ic[0], fixed: true }, { role: 'SCL', pin: ic[1], fixed: true }], power: '3V3', note: NEED[it.type].note, N: NEED[it.type] }); });
  const spiPick = B.spiPick;
  spiParts.forEach((it, n) => {
    const N = NEED[it.type], p = spiPick[n] || [], roles = [['cs', p[0]], ['dc', p[1]], ['rst', p[2]]].map(([r, d]) => { const k = it.key + ':' + r, pin = over[k] != null ? over[k] : (d != null && free(d) ? d : firstFree(ALLB.filter((x) => ADCB.indexOf(x) < 0))); if (pin != null) take(pin, it.label); return { role: r, pin, kind: 'd', k }; });
    rows.push({ it, roles: [{ role: 'clock', pin: sp[0], fixed: true }, { role: 'data', pin: sp[1], fixed: true }].concat(roles), power: '3V3', note: 'Backlight (LED or BL) to 3V3. MISO is not needed.', N });
  });
  i2cParts.forEach((it) => rows.push({ it, roles: [{ role: 'SDA', pin: ic[0], fixed: true }, { role: 'SCL', pin: ic[1], fixed: true }], power: '3V3', note: NEED[it.type].note, N: NEED[it.type] }));
  // 2. her own pin choices are held before anything else is picked
  items.forEach((it) => { const N = NEED[it.type]; if (!N || !N.pins) return; N.pins.forEach(([r, kind]) => { const k = it.key + ':' + r; if (over[k] != null) { take(over[k], it.label); if (kind === 'enc') take(over[k] + 1, it.label); if (kind === 'pwm') pwmSlices[B.pwm(over[k])] = it.label; } }); });
  // 3. analog, then wheels (two pins side by side), then sound and motors, then everything else
  const order = { a: 0, enc: 1, pwm: 2, d: 3 }, wants = [], dac = items.some((i) => i.type === 'i2sdac'); /* a jack with a DAC is wired to the DAC, not the brain */
  items.forEach((it) => { const N = NEED[it.type]; if (!N) return; if (N.pi) { if (!B.pi) problems.push(it.label + ' is an HDMI screen: it needs a Raspberry Pi brain, not a ' + B.name + '.'); return; } if (!N.pins || (N.viaDac && dac)) return; N.pins.forEach(([r, kind]) => wants.push({ it, r, kind })); });
  const got = {};
  wants.slice().sort((a, b) => order[a.kind] + ((NEED[a.it.type].opt || []).indexOf(a.r) > -1 ? 0.5 : 0) - order[b.kind] - ((NEED[b.it.type].opt || []).indexOf(b.r) > -1 ? 0.5 : 0)).forEach(({ it, r, kind }) => {
    const k = it.key + ':' + r; if (over[k] != null) { got[k] = over[k]; return; }
    let pin = null;
    if (kind === 'a') { pin = firstFree(ADCB.filter((p) => ALLB.indexOf(p) < 0)); if (pin == null) pin = firstFree(ADCB); if (pin == null && (NEED[it.type].opt || []).indexOf(r) > -1) { got[k] = null; return; } if (pin == null) problems.push(it.label + ' needs an analog pin, and the ' + B.name + (ADCB.length ? ' has only ' + ADCB.length + ' (' + ADCB.map(L).join(', ') + ').' : ' has none: add an analog board such as an ADS1115.')); }
    else if (kind === 'enc') { pin = ALLB.find((p) => ALLB.indexOf(p + 1) > -1 && ADCB.indexOf(p) < 0 && free(p) && free(p + 1)); if (pin != null) take(pin + 1, it.label); }
    else if (kind === 'pwm') { pin = ALLB.find((p) => ADCB.indexOf(p) < 0 && free(p) && B.pwm(p) > -1 && !pwmSlices[B.pwm(p)]); if (pin != null) pwmSlices[B.pwm(pin)] = it.label; }
    else pin = firstFree(ALLB.filter((p) => ADCB.indexOf(p) < 0)) != null ? firstFree(ALLB.filter((p) => ADCB.indexOf(p) < 0)) : firstFree(ADCB.filter((p) => ALLB.indexOf(p) > -1));
    if (pin == null && kind !== 'a') problems.push('Out of pins for ' + it.label + '. Take a part off, or use a Qwiic button board (one plug for many buttons).');
    if (pin != null) take(pin, it.label); got[k] = pin;
  });
  items.forEach((it) => { const N = NEED[it.type]; if (!N || !N.pins) return; if (N.viaDac && dac) { rows.push({ it, roles: [], power: null, note: 'Wired to the audio DAC: its LOUT, ROUT and AGND go to the tip, ring and sleeve. No brain pin.', N: Object.assign({}, N, { what: 'jack' }) }); return; }
    rows.push({ it, roles: N.pins.filter(([r]) => !((N.opt || []).indexOf(r) > -1 && got[it.key + ':' + r] == null)).map(([r, kind]) => ({ role: r, pin: got[it.key + ':' + r], kind, k: it.key + ':' + r, two: kind === 'enc' })), power: N.power || null, note: N.note || '', N }); });
  rows.sort((a, b) => items.indexOf(a.it) - items.indexOf(b.it));
  return { rows, problems: Array.from(new Set(problems)), used };
}

// a board that does not run CircuitPython (Arduino Nano, Pro Micro, a Raspberry Pi): the pin list for your own code
function pinList(plan, title, B, fn) {
  const L = ['# NOCIV Case Zero: ' + title, '# Brain: ' + B.name + '. It does not run CircuitPython, so there is no starter code.py for it.', B.pi ? '# On a Raspberry Pi, use Python with gpiozero, or Blinka for CircuitPython libraries. The pins are BCM numbers.' : '# Write the code in the Arduino IDE (Arduino Nano, or SparkFun Pro Micro for the Pro Micro). The pin names are the ones printed on the board.', '#', '# Your parts and their pins:'];
  plan.rows.forEach((row) => L.push('#   ' + row.it.label + ': ' + row.roles.map((r) => r.role + ' ' + (r.pin == null ? '?' : B.lab(r.pin)) + (r.two ? ' + ' + B.lab(r.pin + 1) : '')).join(', ') + (row.power ? ', power ' + (row.power === 'VBUS' ? B.v5 : B.v3) : '') + ', GND'));
  plan.problems.forEach((p) => L.push('#   Fix: ' + p));
  if (fn === 'sampler') L.push('#', '# Voice Sampler on an Arduino: read the keypad with the Keypad library (rows and columns above), drive the 8x8 matrix with LedControl (DIN, CLK, CS),', '# play the pads with tone() on the audio pin, and send MIDI: MIDIUSB on a Pro Micro (it is a USB MIDI device), Serial MIDI at 31250 baud on a Nano.', '# Keypad keys, row by row: Pad 1, Pad 2, Pad 3, Mode / Pad 4, Pad 5, Pad 6, Bank / Pad 7, Pad 8, Pad 9, Record / Pad 10, Pad 11, Pad 12, Stop.');
  return { text: L.join('\n') + '\n', libs: [] };
}
// ---------- the starter code ----------
const pyStr = (s) => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
export function codeFor(plan, title, fn, B) {
  B = B || BOARDS.pico; const PFX = B.cp || 'board.GP', LB = B.lab, SPI = B.spi || [18, 19, 16], I2C = B.i2c || [4, 5];
  if (!B.cp) return pinList(plan, title, B, fn); // fn: a recipe's own program (macro, timer, synth) in place of the pin test
  const keys = [], pots = [], encs = [], outs = [], pirs = [], tofs = [], cams = [], mats = [], L = [];
  let mx = null, i2s = null, mic = null;
  let screen = null;
  plan.rows.forEach((row) => {
    const it = row.it, tag = it.label.split(' ')[0], N = row.N, R = {}; row.roles.forEach((r) => { R[r.role] = r.pin; });
    if (N.what === 'motion' && R.out != null) { pirs.push([R.out, tag]); return; }
    if (N.what === 'distance') { tofs.push(tag); return; }
    if (N.what === 'camera') { cams.push([R.cs, tag]); return; }
    if (N.what === 'keypad') { mats.push({ R, tag }); return; }
    if (N.what === 'matrix8') { if (!mx) mx = R; return; }
    if (N.what === 'i2sout') { if (!i2s) i2s = R; return; }
    if (N.what === 'i2sin') { if (!mic) mic = R; return; }
    if (N.what === 'jack') return; /* on the DAC, no brain pin */
    if (N.spi || N.i2c) { if (!screen) screen = { N, R, label: it.label }; return; }
    if (N.what === 'button') row.roles.forEach((r) => { if (r.pin != null) keys.push([r.pin, row.roles.length > 1 ? tag + ' ' + r.role : tag, 'btn']); });
    if (N.what === 'knob' && R.turn != null) pots.push([R.turn, tag, 'knob']);
    if (N.what === 'knob' && R.slide != null) pots.push([R.slide, tag, 'knob']);
    if (N.what === 'stick') { if (R.x != null) pots.push([R.x, tag + ' x', 'x']); if (R.y != null) pots.push([R.y, tag + ' y', 'y']); if (R.press != null) keys.push([R.press, tag + ' press']); }
    if (N.what === 'wheel') { if (R['clk+dt'] != null) encs.push([R['clk+dt'], tag]); if (R.press != null) keys.push([R.press, tag + ' press']); }
    if (['led', 'ring', 'sound', 'servo'].indexOf(N.what) > -1 && row.roles.length && row.roles[0].pin != null) outs.push([N.what, row.roles[0].pin, tag]);
  });
  const has = (w) => outs.some((o) => o[0] === w), libs = [];
  if (screen) { libs.push('adafruit_display_text'); if (screen.N.driver === 'ili9341') libs.push('adafruit_ili9341.mpy'); if (screen.N.driver === 'ssd1306') libs.push('adafruit_displayio_ssd1306.mpy'); if (screen.N.driver === 'gc9a01') libs.push('gc9a01.mpy (from the Community Bundle)'); }
  if (has('ring')) libs.push('neopixel.mpy'); if (has('servo')) libs.push('adafruit_motor'); if (tofs.length) libs.push('adafruit_vl53l0x.mpy'); if (fn === 'macro' && keys.length) libs.push('adafruit_hid');
  if (mx) libs.push('adafruit_max7219', 'adafruit_framebuf.mpy', 'adafruit_bus_device'); if (fn === 'sampler') libs.push('adafruit_midi');
  const sam = fn === 'sampler' && mats.length, synth = !!i2s || (sam && has('sound')); /* synthio plays the pads: out of the I2S DAC, or one PWM pin to the jack */
  const bus = !!(cams.length || tofs.length); /* sensors share one I2C bus (and the camera the SPI bus) with the screen, made once at the top */
  L.push('# NOCIV Case Zero starter code. ' + title, '# Brain: ' + B.name + (B === BOARDS.pico ? ', Pico W or Pico 2 (same pins).' : '. CircuitPython names its pins board.IO and the number.'), '#',
    '# 1. Put CircuitPython 9 or newer on the Pico: circuitpython.org, search your board, follow the steps.',
    libs.length ? '# 2. From the CircuitPython Library Bundle, copy into CIRCUITPY/lib: ' + libs.join(', ') + '.' : '# 2. No extra libraries needed.',
    '# 3. Save this file as code.py on the CIRCUITPY drive. It starts by itself.', '#',
    '# Every press, turn and slide also prints a line like "NOCIV B1 1" for the live test.', '# Pins come from your Case Zero wiring map. Change them there and save this file again.', '',
    'import time', 'import board');
  if (keys.length || mats.length) L.push('import keypad');
  if (pots.length) L.push('import analogio');
  if (encs.length) L.push('import rotaryio');
  const inputs = keys.length || pots.length || encs.length || pirs.length || mats.length;
  if (has('led') || inputs || cams.length) L.push('import digitalio');
  if (bus) L.push('import busio');
  if ((has('sound') && !sam) || has('servo')) L.push('import pwmio');
  if (synth) L.push('import synthio', i2s ? 'import audiobusio' : 'import audiopwmio');
  if (mx) L.push('import bitbangio', 'from adafruit_max7219 import matrices');
  if (has('ring')) L.push('import neopixel');
  if (has('servo')) L.push('from adafruit_motor import servo');
  L.push('');
  L.push('status = None', '');
  if (bus) { L.push('# ---- the shared wires: I2C on ' + LB(I2C[0]) + ' (SDA) and ' + LB(I2C[1]) + ' (SCL)' + (cams.length ? ', SPI on ' + SPI.map(LB).join(', ') : '') + ' ----', 'try:', '    i2c = busio.I2C(' + PFX + I2C[1] + ', ' + PFX + I2C[0] + ')', 'except Exception as err:', '    i2c = None', '    print("NOCIV I2C not found yet:", err)');
    if (cams.length) L.push('spi = busio.SPI(' + PFX + SPI[0] + ', MOSI=' + PFX + SPI[1] + ', MISO=' + PFX + SPI[2] + ')');
    L.push(''); }
  if (screen) {
    const S2 = screen.N, R = screen.R, big = S2.w >= 240, at = L.length;
    L.push('# ---- screen: ' + screen.label + ' ----', 'import busio', 'import displayio', 'import terminalio', 'from adafruit_display_text import label', 'displayio.release_displays()');
    if (S2.spi) {
      L.push('try:', '    from fourwire import FourWire', 'except ImportError:', '    from displayio import FourWire');
      if (!cams.length) L.push('spi = busio.SPI(' + PFX + SPI[0] + ', MOSI=' + PFX + SPI[1] + ')');
      L.push('bus = FourWire(spi, command=' + PFX + R.dc + ', chip_select=' + PFX + R.cs + ', reset=' + PFX + R.rst + ', baudrate=24000000)');
      if (S2.driver === 'ili9341') L.push('import adafruit_ili9341', 'display = adafruit_ili9341.ILI9341(bus, width=320, height=240)');
      else L.push('import gc9a01', 'display = gc9a01.GC9A01(bus, width=240, height=240)');
    } else {
      L.push('try:', '    from i2cdisplaybus import I2CDisplayBus', 'except ImportError:', '    from displayio import I2CDisplay as I2CDisplayBus');
      L.push('import adafruit_displayio_ssd1306'); if (!bus) L.push('i2c = busio.I2C(' + PFX + I2C[1] + ', ' + PFX + I2C[0] + ')'); L.push('bus = I2CDisplayBus(i2c, device_address=0x3C)', 'display = adafruit_displayio_ssd1306.SSD1306(bus, width=128, height=64)');
    }
    L.push('group = displayio.Group()', 'display.root_group = group',
      'title = label.Label(terminalio.FONT, text="NOCIV", scale=' + (big ? 3 : 2) + ', x=' + (S2.driver === 'gc9a01' ? 70 : 8) + ', y=' + (big ? 40 : 12) + ')',
      'status = label.Label(terminalio.FONT, text="Press a button", scale=' + (big ? 2 : 1) + ', x=' + (S2.driver === 'gc9a01' ? 40 : 8) + ', y=' + (big ? 110 : 44) + ')',
      'group.append(title)', 'group.append(status)');
    // everything about the screen sits inside one try: with no screen connected yet, the rest still runs and can be tested
    const body = L.splice(at + 1).map((x) => '    ' + x); L.push('try:'); body.forEach((x) => L.push(x)); L.push('except Exception as err:', '    status = None', '    print("NOCIV screen not found yet:", err)', '');
  }
  L.push('def show(text):', '    if status:', '        status.text = text', '');
  if (keys.length) L.push('# ---- buttons (pressed = pin to GND, the Pico pulls it up inside) ----', 'KEYS = (' + keys.map((k) => '' + PFX + k[0]).join(', ') + ',)', 'NAMES = (' + keys.map((k) => pyStr(k[1])).join(', ') + ',)', 'keys = keypad.Keys(KEYS, value_when_pressed=False, pull=True)', '');
  if (pots.length) L.push('# ---- knobs, sliders and sticks (0 to 100) ----', 'POTS = (' + pots.map((p) => '(analogio.AnalogIn(' + PFX + p[0] + '), ' + pyStr(p[1]) + ')').join(', ') + ',)', 'last = [-10] * len(POTS)', '');
  if (mats.length) { const R = mats[0].R; L.push('# ---- ' + mats[0].tag + ' 4x4 keypad: 4 row wires and 4 column wires, 16 keys ----', 'PADS = keypad.KeyMatrix(row_pins=(' + [1, 2, 3, 4].map((i) => PFX + R['row' + i]).join(', ') + '), column_pins=(' + [1, 2, 3, 4].map((i) => PFX + R['col' + i]).join(', ') + '))',
    'PAD_NAMES = ' + (sam ? '("Pad 1", "Pad 2", "Pad 3", "Mode", "Pad 4", "Pad 5", "Pad 6", "Bank", "Pad 7", "Pad 8", "Pad 9", "Record", "Pad 10", "Pad 11", "Pad 12", "Stop")' : '("1", "2", "3", "A", "4", "5", "6", "B", "7", "8", "9", "C", "*", "0", "#", "D")'), ''); }
  if (mx) L.push('# ---- 8x8 LED matrix (MAX7219): DIN ' + LB(mx.din) + ', CS ' + LB(mx.cs) + ', CLK ' + LB(mx.clk) + ' ----', 'leds = None', 'try:', '    leds = matrices.Matrix8x8(bitbangio.SPI(' + PFX + mx.clk + ', MOSI=' + PFX + mx.din + '), digitalio.DigitalInOut(' + PFX + mx.cs + '))', '    leds.brightness(3)', '    leds.fill(0)', '    leds.show()', 'except Exception as err:', '    print("NOCIV LED matrix not found yet:", err)', '');
  if (synth) { const jk = outs.find((o) => o[0] === 'sound'); L.push(i2s ? '# ---- sound: the I2S DAC on BCLK ' + LB(i2s['bclk+lrc']) + ', LRC ' + LB(i2s['bclk+lrc'] + 1) + ', DIN ' + LB(i2s.din) + ' ----' : '# ---- sound: one pin (' + LB(jk[1]) + ') to the jack, mono, through the 1K resistor and 100 nF capacitor ----',
    i2s ? 'audio = audiobusio.I2SOut(bit_clock=' + PFX + i2s['bclk+lrc'] + ', word_select=' + PFX + (i2s['bclk+lrc'] + 1) + ', data=' + PFX + i2s.din + ')' : 'audio = audiopwmio.PWMAudioOut(' + PFX + jk[1] + ')', 'synth = synthio.Synthesizer(sample_rate=22050)', 'audio.play(synth)', ''); }
  if (mic) L.push('# ---- I2S mic (INMP441): SCK ' + LB(mic['sck+ws']) + ', WS ' + LB(mic['sck+ws'] + 1) + ', SD ' + LB(mic.sd) + '.', '# CircuitPython has no I2S input yet. To record it, use MicroPython (machine.I2S) or the Arduino I2S library with these pins.', '');
  if (encs.length) L.push('# ---- click wheels (the two pins sit side by side) ----', 'WHEELS = (' + encs.map((e) => '(rotaryio.IncrementalEncoder(' + PFX + e[0] + ', ' + PFX + (e[0] + 1) + '), ' + pyStr(e[1]) + ')').join(', ') + ',)', 'spot = [0] * len(WHEELS)', '');
  outs.forEach(([w, pin, tag]) => { if (w === 'sound' && sam) return; /* the sampler plays its pin with synthio */
    if (w === 'led') L.push('# ---- ' + tag + ' light ----', 'led = digitalio.DigitalInOut(' + PFX + pin + ')', 'led.direction = digitalio.Direction.OUTPUT', '');
    if (w === 'ring') L.push('# ---- ' + tag + ' light ring ----', 'ring = neopixel.NeoPixel(' + PFX + pin + ', 12, brightness=0.2)', '');
    if (w === 'sound') L.push('# ---- ' + tag + ' sound ----', 'beep = pwmio.PWMOut(' + PFX + pin + ', frequency=440, duty_cycle=0, variable_frequency=True)', '');
    if (w === 'servo') L.push('# ---- ' + tag + ' servo ----', 'arm = servo.Servo(pwmio.PWMOut(' + PFX + pin + ', duty_cycle=2 ** 15, frequency=50))', '');
  });
  if (pirs.length) L.push('# ---- motion sensors: OUT goes high while something moves ----', 'PIRS = []', 'for gp, name in (' + pirs.map((q) => '(' + PFX + q[0] + ', ' + pyStr(q[1]) + ')').join(', ') + ',):', '    pin = digitalio.DigitalInOut(gp)', '    pin.direction = digitalio.Direction.INPUT', '    PIRS.append([pin, name, False])', '');
  if (tofs.length) L.push('# ---- laser distance (VL53L0X), in mm. Several on one bus need their address changed: one works as it comes ----', 'tof = None', 'try:', '    import adafruit_vl53l0x', '    tof = adafruit_vl53l0x.VL53L0X(i2c)', 'except Exception as err:', '    print("NOCIV distance sensor not found yet:", err)', 'tof_name = ' + pyStr(tofs[0]), 'tof_next = 0', '');
  if (cams.length) L.push('# ---- SPI camera (Arducam Mini 2MP): this checks it answers on both buses.', '# To take photos, add Arducam\'s CircuitPython code for the Pico (their PICO_SPI_CAM examples) and use the same pins.', 'cam_cs = digitalio.DigitalInOut(' + PFX + cams[0][0] + ')', 'cam_cs.direction = digitalio.Direction.OUTPUT', 'cam_cs.value = True',
    'def camera_ok():', '    buf = bytearray(1)', '    while not spi.try_lock():', '        pass', '    try:', '        spi.configure(baudrate=4000000)', '        cam_cs.value = False', '        spi.write(bytes([0x80, 0x55]))', '        cam_cs.value = True', '        cam_cs.value = False', '        spi.write(bytes([0x00]))', '        spi.readinto(buf)', '        cam_cs.value = True', '    finally:', '        spi.unlock()',
    '    seen = False', '    if i2c and i2c.try_lock():', '        try:', '            seen = 0x30 in i2c.scan()', '        finally:', '            i2c.unlock()', '    return buf[0] == 0x55 and seen', '',
    'if camera_ok():', '    print("NOCIV ' + cams[0][1] + ' 1")', '    show("Camera found")', 'else:', '    print("NOCIV ' + cams[0][1] + ' 0")', '    show("Camera not found")', '');
  if (inputs) L.push('# ---- the small light on the Pico itself: it shows a press with no screen and no computer ----', 'try:', '    lamp = digitalio.DigitalInOut(board.LED)', '    lamp.direction = digitalio.Direction.OUTPUT', 'except (AttributeError, ValueError):', '    lamp = None', '');
  const snd = has('sound'), st = Math.max(0, keys.findIndex((k) => k[2] === 'btn'));
  if (fn === 'macro' && keys.length) {
    L.push('# ---- 4-Button Macro Pad: each button sends a shortcut to the computer over USB ----', 'import usb_hid', 'from adafruit_hid.keyboard import Keyboard', 'from adafruit_hid.keycode import Keycode', 'from adafruit_hid.consumer_control import ConsumerControl', 'from adafruit_hid.consumer_control_code import ConsumerControlCode',
      'MAC = False  # True on a Mac: Cmd instead of Ctrl', 'kbd = Keyboard(usb_hid.devices)', 'media = ConsumerControl(usb_hid.devices)', 'MOD = Keycode.GUI if MAC else Keycode.CONTROL', 'MODNAME = "Cmd" if MAC else "Ctrl"',
      'SHORTCUTS = (("C", Keycode.C, "copy"), ("V", Keycode.V, "paste"), ("Z", Keycode.Z, "undo"), ("PLAY", None, "play/pause"))', '',
      'def fire(n):', '    if n >= len(SHORTCUTS):', '        return NAMES[n]', '    letter, code, what = SHORTCUTS[n]', '    if code is None:', '        media.send(ConsumerControlCode.PLAY_PAUSE)', '        return "Play/Pause"', '    kbd.send(MOD, code)', '    return MODNAME + "+" + letter + " (" + what + ")"', '',
      'show("Macro pad ready")', 'print("NOCIV ready")', '', 'while True:', '    event = keys.events.get()', '    if event:', '        down = 1 if event.pressed else 0', '        print("NOCIV", NAMES[event.key_number].replace(" ", "-"), down)', '        if lamp:', '            lamp.value = bool(down)', '        if down:', '            shortcut = fire(event.key_number)', '            print("NOCIV sent", shortcut)', '            show(shortcut)', '    time.sleep(0.01)', '');
    return { text: L.join('\n'), libs };
  }
  if (fn === 'timer' && keys.length) {
    L.push('# ---- Desk Timer: press the button to start or pause, hold it 1 s to reset' + (encs.length ? ', turn the wheel to set the minutes' : '') + '. It beeps at 00:00 ----', 'START = ' + st, 'minutes = 25', 'remaining = minutes * 60', 'running = False', 'tick = time.monotonic()', 'held_at = None', '',
      'def clock():', '    return "%02d:%02d" % (remaining // 60, remaining % 60)', '', 'def ring_bell():');
    if (snd) L.push('    for _ in range(3):', '        beep.frequency = 880', '        beep.duty_cycle = 2 ** 15', '        time.sleep(0.15)', '        beep.duty_cycle = 0', '        time.sleep(0.1)', ''); else L.push('    print("NOCIV beep")', '');
    L.push('show(clock())', 'print("NOCIV ready")', '', 'while True:', '    now = time.monotonic()', '    event = keys.events.get()', '    if event and event.key_number == START:', '        if event.pressed:', '            held_at = now', '        elif held_at is not None:', '            if now - held_at >= 1:', '                running = False', '                remaining = minutes * 60', '                print("NOCIV timer reset")', '            else:', '                running = not running', '                tick = now', '                print("NOCIV timer", "start" if running else "pause")', '            held_at = None', '            show(clock() if running or remaining == minutes * 60 else clock() + " paused")');
    if (encs.length) L.push('    if not running and WHEELS[0][0].position != spot[0]:', '        minutes = max(1, min(99, minutes + WHEELS[0][0].position - spot[0]))', '        spot[0] = WHEELS[0][0].position', '        remaining = minutes * 60', '        show(clock())');
    L.push('    if running and now - tick >= 1:', '        tick += 1', '        remaining -= 1', '        show(clock())', '        if remaining <= 0:', '            running = False', '            show("00:00 done!")', '            print("NOCIV timer done")', '            ring_bell()', '            remaining = minutes * 60', '    time.sleep(0.01)', '');
    return { text: L.join('\n'), libs };
  }
  if (fn === 'synth' && keys.length && snd) {
    L.push('# ---- Mini Synth: each button plays a note.' + (pots.length ? ' Knob 1 moves the pitch' + (pots.length > 1 ? ', knob 2 sets the tempo of the arpeggio while you hold a key' : '') + '.' : '') + ' ----', 'SCALE = (262, 294, 330, 349, 392, 440, 494, 523)', 'NOTE = ("C", "D", "E", "F", "G", "A", "B", "C")', 'ARP = ' + (pots.length > 1 ? '(1, 1.5, 2)' : '(1,)'), 'held = None', 'step = 0', 'next_step = 0', 'transpose = 0', 'bpm = 120', '',
      'show("Synth ready")', 'print("NOCIV ready")', '', 'while True:', '    now = time.monotonic()', '    event = keys.events.get()', '    if event:', '        if event.pressed:', '            held = event.key_number', '            step = 0', '            next_step = now', '            if lamp:', '                lamp.value = True', '        elif event.key_number == held:', '            held = None', '            beep.duty_cycle = 0', '            if lamp:', '                lamp.value = False');
    if (pots.length) L.push('    transpose = POTS[0][0].value * 24 // 65535 - 12');
    if (pots.length > 1) L.push('    bpm = 60 + POTS[1][0].value * 180 // 65535');
    L.push('    if held is not None and now >= next_step:', '        f = SCALE[held % 8] * 2 ** (held // 8 + transpose / 12) * ARP[step % len(ARP)]', '        beep.frequency = max(20, int(f))', '        beep.duty_cycle = 2 ** 15', '        if step == 0:', '            print("NOCIV note", NOTE[held % 8], int(f))', '            show(NOTE[held % 8] + " " + str(int(f)) + " Hz")', '        step += 1', '        next_step = now + 60 / bpm / 2', '    time.sleep(0.005)', '');
    return { text: L.join('\n'), libs };
  }
  if (sam) {
    const ix = (k, n) => { const i = pots.map((p, j) => (p[2] === k ? j : -1)).filter((j) => j > -1)[n || 0]; return i == null ? 'None' : String(i); };
    L.push('# ---- Voice Sampler: 12 pads play a sound and send a USB MIDI note. Mode, Bank, Record and Stop are the right column. ----', '# Knob 1 = Pitch (-12 to +12), knob 2 = Effect (0 to 100, how long a sound rings), the stick = Scrub (MIDI CC 1). Every event also prints "NOCIV ..." on Serial.',
      'import array', 'import math', 'import random', 'import usb_midi', 'import adafruit_midi', 'from adafruit_midi.note_on import NoteOn', 'from adafruit_midi.note_off import NoteOff', 'from adafruit_midi.control_change import ControlChange', '',
      'midi = adafruit_midi.MIDI(midi_out=usb_midi.ports[1], out_channel=0)', 'MODES = ("Chopper", "Drum", "Ambient")', 'PAD_OF = (0, 1, 2, None, 3, 4, 5, None, 6, 7, 8, None, 9, 10, 11, None)',
      'WAVES = (', '    array.array("h", [int(30000 - i * 60000 / 256) for i in range(256)]),', '    array.array("h", [random.randint(-30000, 30000) for _ in range(256)]),', '    array.array("h", [int(30000 * math.sin(i * math.pi / 128)) for i in range(256)]),', ')',
      'PITCH, EFFECT, SCRUB = ' + ix('knob', 0) + ', ' + ix('knob', 1) + ', ' + ix('x', 0), 'mode = 0', 'bank = 0', 'recording = False', 'pitch = 0', 'effect = 50', 'scrub = 50', 'voices = {}', '',
      'def note_of(n):', '    return 36 + n if mode == 1 else 48 + bank * 12 + n', '', 'def hz(n):', '    return 440 * 2 ** ((note_of(n) - 69 + pitch) / 12)', '',
      'def envelope():', '    if mode == 0:', '        return synthio.Envelope(attack_time=0.002, decay_time=0.08 + effect / 400, sustain_level=0.5, release_time=0.05)', '    if mode == 1:', '        return synthio.Envelope(attack_time=0.001, decay_time=0.04 + effect / 600, sustain_level=0.0, release_time=0.04)', '    return synthio.Envelope(attack_time=0.3, decay_time=0.4, sustain_level=0.8, release_time=0.4 + effect / 40)', '',
      'def light(n):', '    if not leds:', '        return', '    leds.fill(0)', '    if n is not None:', '        x, y = (n % 4) * 2, (n // 4) * 2', '        for dx in (0, 1):', '            for dy in (0, 1):', '                leds.pixel(x + dx, y + dy, 1)', '    for i in range(effect * 8 // 101 + 1):', '        leds.pixel(i, 7, 1)', '    leds.show()', '',
      'def knob(i):', '    if i is None:', '        return None', '    v = POTS[i][0].value * 100 // 65535', '    if abs(v - last[i]) < 2:', '        return None', '    last[i] = v', '    return v', '');
    if (!mx) L.push('leds = None', '');
    if (!synth) L.push('synth = None  # add the 3.5mm jack or the I2S DAC to hear the pads', '');
    if (!pots.length) L.push('POTS = ()', 'last = []', '');
    L.push('show("Sampler: " + MODES[mode])', 'light(None)', 'print("NOCIV ready")', '', 'while True:', '    event = PADS.events.get()', '    if event:', '        name = PAD_NAMES[event.key_number]', '        n = PAD_OF[event.key_number]', '        print("NOCIV", name.replace(" ", "-"), 1 if event.pressed else 0)', '        if lamp:', '            lamp.value = event.pressed',
      '        if n is not None and event.pressed:', '            voice = synthio.Note(hz(n), waveform=WAVES[mode], envelope=envelope())', '            voices[n] = voice', '            if synth:', '                synth.press(voice)', '            midi.send(NoteOn(note_of(n), 100))', '            light(n)', '            show(name + " " + MODES[mode])',
      '        elif n is not None:', '            voice = voices.pop(n, None)', '            if voice and synth:', '                synth.release(voice)', '            midi.send(NoteOff(note_of(n), 0))',
      '        elif event.pressed:', '            if name == "Mode":', '                mode = (mode + 1) % 3', '                show("Mode: " + MODES[mode])', '            elif name == "Bank":', '                bank = (bank + 1) % 4', '                show("Bank " + "ABCD"[bank])', '            elif name == "Record":', '                recording = not recording', '                show("REC" if recording else "Rec off")', '                print("NOCIV record", 1 if recording else 0)', '            elif name == "Stop":', '                if synth:', '                    synth.release_all()', '                voices.clear()', '                light(None)', '                show("Stop")',
      '    v = knob(PITCH)', '    if v is not None:', '        pitch = v * 24 // 100 - 12', '        for n, voice in voices.items():', '            voice.frequency = hz(n)', '        midi.send(ControlChange(16, v * 127 // 100))', '        print("NOCIV Pitch", pitch)', '        show("Pitch %+d" % pitch)',
      '    v = knob(EFFECT)', '    if v is not None:', '        effect = v', '        midi.send(ControlChange(74, v * 127 // 100))', '        print("NOCIV Effect", v)', '        show("Effect " + str(v))', '        light(None)',
      '    v = knob(SCRUB)', '    if v is not None:', '        scrub = v', '        midi.send(ControlChange(1, v * 127 // 100))', '        print("NOCIV Scrub", v)', '        show("Scrub " + str(v) + "%")', '    time.sleep(0.005)', '');
    if (B === BOARDS.pico) { const its = plan.rows.map((r) => r.it), np = planWiring(its, {}, BOARDS.nano); L.push('# ---- Arduino pin map reference: the same parts on an Arduino Nano ----'); np.rows.forEach((row) => L.push('#   ' + row.it.label + ': ' + (row.roles.length ? row.roles.map((r) => r.role + ' ' + (r.pin == null ? '?' : BOARDS.nano.lab(r.pin)) + (r.two ? ' + ' + BOARDS.nano.lab(r.pin + 1) : '')).join(', ') : 'no pin') + (row.power ? ', power ' + (row.power === 'VBUS' ? '5V' : '3V3') : ''))); np.problems.forEach((p) => L.push('#   Fix: ' + p)); L.push(''); }
    return { text: L.join('\n'), libs };
  }
  L.push('show("Ready")', 'print("NOCIV ready")', '', 'while True:');
  let body = 0;
  if (mats.length) { L.push('    event = PADS.events.get()', '    if event:', '        print("NOCIV", "Key-" + PAD_NAMES[event.key_number], 1 if event.pressed else 0)', '        if lamp:', '            lamp.value = event.pressed', '        if event.pressed:', '            show("Key " + PAD_NAMES[event.key_number])');
    if (mx) L.push('            if leds:', '                leds.fill(0)', '                leds.pixel(event.key_number % 4 * 2, event.key_number // 4 * 2, 1)', '                leds.show()');
    if (synth) L.push('            synth.press(60 + event.key_number)', '        else:', '            synth.release(60 + event.key_number)');
    body++; }
  if (keys.length) {
    L.push('    event = keys.events.get()', '    if event:', '        name = NAMES[event.key_number]', '        down = 1 if event.pressed else 0', '        print("NOCIV", name.replace(" ", "-"), down)', '        if lamp:', '            lamp.value = bool(down)', '        if down:', '            show(name + " pressed")');
    if (has('led')) L.push('            led.value = not led.value');
    if (has('ring')) L.push('            ring.fill((200, 40, 30))');
    if (has('sound') && !synth) L.push('            beep.frequency = 330 + 60 * event.key_number', '            beep.duty_cycle = 2 ** 14');
    if (synth) L.push('            synth.press(60 + event.key_number)');
    if (has('servo') && !pots.length) L.push('            arm.angle = 90 if arm.angle is None or arm.angle < 45 else 0');
    if (has('ring') || has('sound') || synth) { L.push('        else:'); if (has('ring')) L.push('            ring.fill((0, 0, 0))'); if (has('sound') && !synth) L.push('            beep.duty_cycle = 0'); if (synth) L.push('            synth.release_all()'); }
    body++;
  }
  if (pots.length) {
    L.push('    for n, (pot, name) in enumerate(POTS):', '        value = pot.value * 100 // 65535', '        if abs(value - last[n]) >= 2:', '            last[n] = value', '            print("NOCIV", name.replace(" ", "-"), value)', '            show(name + " " + str(value))', '            if lamp:', '                lamp.value = not lamp.value');
    if (has('servo')) L.push('            if n == 0:', '                arm.angle = value * 180 // 100');
    body++;
  }
  if (encs.length) { L.push('    for n, (wheel, name) in enumerate(WHEELS):', '        if wheel.position != spot[n]:', '            spot[n] = wheel.position', '            print("NOCIV", name, spot[n])', '            show(name + " " + str(spot[n]))', '            if lamp:', '                lamp.value = not lamp.value'); body++; }
  if (pirs.length) { L.push('    for p in PIRS:', '        if p[0].value != p[2]:', '            p[2] = p[0].value', '            print("NOCIV", p[1], 1 if p[2] else 0)', '            show(p[1] + (" motion" if p[2] else " still"))', '            if lamp:', '                lamp.value = p[2]'); body++; }
  if (tofs.length) { L.push('    if tof and time.monotonic() > tof_next:', '        tof_next = time.monotonic() + 0.25', '        mm = tof.range', '        print("NOCIV", tof_name, mm)', '        show(tof_name + " " + str(mm) + " mm")'); body++; }
  if (!body) L.push('    pass');
  L.push('    time.sleep(0.01)', '');
  return { text: L.join('\n'), libs };
}
