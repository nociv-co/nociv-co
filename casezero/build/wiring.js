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
  pico: { name: 'Raspberry Pi Pico', left: PICO_LEFT, right: PICO_RIGHT, all: ALL, adc: ADC, spi: [18, 19, 16], i2c: [4, 5], spiPick: [[17, 20, 21], [22, 16, 15], [14, 13, 12]], camCs: [17, 20, 21, 22], uart: [0, 4, 8, 12, 16], lab: (n) => 'GP' + n, cp: 'board.GP', pwm: PICO_PWM, v5: 'VBUS', v3: '3V3' },
  nano: { name: 'Arduino Nano', left: ['D13', '3V3', 'AREF', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', '5V', 'RST', 'GND', 'VIN'], right: ['D12', 'D11', 'D10', 'D9', 'D8', 'D7', 'D6', 'D5', 'D4', 'D3', 'D2', 'GND', 'RST', 'D0', 'D1'],
    all: range(2, 19), adc: range(14, 21), spi: [13, 11, 12], i2c: [18, 19], spiPick: [[10, 9, 8], [7, 6, 5]], camCs: [10, 9, 8], lab: (n) => (n >= 14 ? 'A' + (n - 14) : 'D' + n), cp: null, ino: true, pwm: (n) => ([3, 5, 6, 9, 10, 11].indexOf(n) > -1 ? n : -1), v5: '5V', v3: '3V3' },
  uno: { name: 'Elegoo / Arduino Uno', left: ['IOREF', 'RST', '3V3', '5V', 'GND', 'GND', 'VIN', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5'], right: ['SCL', 'SDA', 'AREF', 'GND', 'D13', 'D12', 'D11', 'D10', 'D9', 'D8', 'D7', 'D6', 'D5', 'D4', 'D3', 'D2', 'D1', 'D0'],
    all: range(2, 19), adc: range(14, 19), spi: [13, 11, 12], i2c: [18, 19], spiPick: [[10, 9, 8], [7, 6, 5]], camCs: [10, 9, 8], lab: (n) => (n >= 14 ? 'A' + (n - 14) : 'D' + n), cp: null, ino: true, pwm: (n) => ([3, 5, 6, 9, 10, 11].indexOf(n) > -1 ? n : -1), v5: '5V', v3: '3V3' },
  promicro: { name: 'Pro Micro (ATmega32U4)', left: ['D1', 'D0', 'GND', 'GND', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9'], right: ['RAW', 'GND', 'RST', 'VCC', 'A3', 'A2', 'A1', 'A0', 'D15', 'D14', 'D16', 'D10'],
    all: [2, 3, 4, 5, 6, 7, 8, 9, 10, 14, 15, 16, 18, 19, 20, 21], adc: [18, 19, 20, 21], spi: [15, 16, 14], i2c: [2, 3], spiPick: [[10, 9, 8], [7, 6, 5]], camCs: [10, 9], lab: (n) => (n >= 18 ? 'A' + (21 - n) : 'D' + n), cp: null, ino: true, pwm: (n) => ([3, 5, 6, 9, 10].indexOf(n) > -1 ? n : -1), v5: 'VCC', v3: 'VCC' },
  c3: { name: 'ESP32-C3 SuperMini', left: ['5V', 'GND', '3V3', 'GPIO4', 'GPIO3', 'GPIO2', 'GPIO1', 'GPIO0'], right: ['GPIO5', 'GPIO6', 'GPIO7', 'GPIO8', 'GPIO9', 'GPIO10', 'GPIO20', 'GPIO21'],
    all: [5, 6, 7, 10, 20, 21, 0, 1, 2, 3, 4, 8, 9], adc: [0, 1, 2, 3, 4], spi: [4, 6, 5], i2c: [8, 9] /* 8 (the LED) and 9 (BOOT) last */, spiPick: [[7, 10, 3]], camCs: [7, 10], lab: (n) => 'GPIO' + n, cp: 'board.IO', pwm: (n) => n, v5: '5V', v3: '3V3' },
  esp32: { name: 'ESP32 DevKit', left: ['EN', 'GPIO36', 'GPIO39', 'GPIO34', 'GPIO35', 'GPIO32', 'GPIO33', 'GPIO25', 'GPIO26', 'GPIO27', 'GPIO14', 'GPIO12', 'GPIO13', 'GND', 'VIN'], right: ['GPIO23', 'GPIO22', 'TX0', 'RX0', 'GPIO21', 'GPIO19', 'GPIO18', 'GPIO5', 'GPIO17', 'GPIO16', 'GPIO4', 'GPIO2', 'GPIO15', 'GND', '3V3'],
    all: [4, 5, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33], adc: [32, 33, 34, 35, 36, 39], spi: [18, 23, 19], i2c: [21, 22], spiPick: [[5, 17, 16], [15, 4, 2]], camCs: [5, 15], lab: (n) => 'GPIO' + n, cp: 'board.IO', pwm: (n) => n, v5: 'VIN', v3: '3V3' },
  /* AI-Thinker ESP32-CAM: the camera takes most GPIOs and the SD slot shares 2/4/12-15, so only these are handed out; 15/14 are the OLED's I2C (as in retrocam.ino) */
  cam: { name: 'ESP32-CAM (AI-Thinker)', left: ['5V', 'GND', 'GPIO12', 'GPIO13', 'GPIO15', 'GPIO14', 'GPIO2', 'GPIO4'], right: ['3V3', 'GPIO16', 'GPIO0', 'GND', 'VCC', 'U0R', 'U0T', 'GND'],
    all: [13, 2, 12, 4], adc: [], spi: null, i2c: [15, 14], spiPick: [], camCs: [], lab: (n) => 'GPIO' + n, cp: null, ino: true, pwm: (n) => n, v5: '5V', v3: '3V3' },
  /* ESP32-S3-DevKitC-1 (N16R8): GPIO35 to 37 belong to the octal PSRAM, GPIO0/3/45/46 are strapping pins, 19/20 are USB: none of them are handed out. */
  s3: { name: 'ESP32-S3 DevKit', left: ['3V3', '3V3', 'RST', 'GPIO4', 'GPIO5', 'GPIO6', 'GPIO7', 'GPIO15', 'GPIO16', 'GPIO17', 'GPIO18', 'GPIO8', 'GPIO3', 'GPIO46', 'GPIO9', 'GPIO10', 'GPIO11', 'GPIO12', 'GPIO13', 'GPIO14', '5V', 'GND'],
    right: ['GND', 'TX', 'RX', 'GPIO1', 'GPIO2', 'GPIO42', 'GPIO41', 'GPIO40', 'GPIO39', 'GPIO38', 'GPIO37', 'GPIO36', 'GPIO35', 'GPIO0', 'GPIO45', 'GPIO48', 'GPIO47', 'GPIO21', 'GPIO20', 'GPIO19', 'GND', 'GND'],
    all: [4, 5, 6, 7, 15, 16, 17, 18, 1, 2, 42, 41, 40, 39, 38, 21, 47, 48, 14, 10, 11, 12, 13, 8, 9], adc: [1, 2, 4, 5, 6, 7, 8, 9, 10], spi: [12, 11, 13], i2c: [8, 9], spiPick: [[10, 14, 21]], camCs: [10, 14], lab: (n) => 'GPIO' + n, cp: 'board.IO', ino: true, pwm: (n) => n, v5: '5V', v3: '3V3' },
  cyd: { name: 'Cheap Yellow Display', left: ['3V3', 'GPIO27', 'GPIO22', 'GND'], right: ['VIN', 'GPIO35', 'GPIO21', 'GND'], all: [22, 27, 21], adc: [35], spi: null, i2c: [27, 22], spiPick: [], camCs: [], lab: (n) => 'GPIO' + n, cp: 'board.IO', ino: true, pwm: (n) => n, v5: 'VIN', v3: '3V3', builtIn: 'its own 2.8 in touch screen' },
  pi: { name: 'Raspberry Pi (40 pin header)', left: ['3V3', 'GPIO2', 'GPIO3', 'GPIO4', 'GND', 'GPIO17', 'GPIO27', 'GPIO22', '3V3', 'GPIO10', 'GPIO9', 'GPIO11', 'GND', 'ID_SD', 'GPIO5', 'GPIO6', 'GPIO13', 'GPIO19', 'GPIO26', 'GND'], right: ['5V', '5V', 'GND', 'GPIO14', 'GPIO15', 'GPIO18', 'GND', 'GPIO23', 'GPIO24', 'GND', 'GPIO25', 'GPIO8', 'GPIO7', 'ID_SC', 'GND', 'GPIO12', 'GND', 'GPIO16', 'GPIO20', 'GPIO21'],
    all: [4, 17, 27, 22, 5, 6, 13, 19, 26, 23, 24, 25, 12, 16, 20, 21, 18], adc: [], spi: [11, 10, 9], i2c: [2, 3], spiPick: [[8, 25, 24], [7, 23, 22]], camCs: [8, 7], lab: (n) => 'GPIO' + n, cp: null, pwm: (n) => ([12, 13, 18, 19].indexOf(n) > -1 ? n % 2 : -1), v5: '5V', v3: '3V3', pi: true }
};
export const BOARD_OF = { uno: 'uno', pico: 'pico', picow: 'pico', pico2: 'pico', nano: 'nano', promicro: 'promicro', esp32c3: 'c3', esp32s3: 's3', esp32cam: 'cam', esp32: 'esp32', cyd: 'cyd', zero2: 'pi', pi5: 'pi' };

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
  dfplayer: { pins: [['tx+rx', 'uart']], power: 'VBUS', what: 'mp3', note: 'The brain TX (first pin) through a 1K resistor to the DFPlayer RX, the DFPlayer TX to the brain RX (second pin). VCC to 5V. A small speaker on SPK1 and SPK2.' },
  sdcard: { sd: true, power: 'VBUS', what: 'sd', note: 'VCC to 5V (the module has its own 3.3V regulator). SCK, MOSI and MISO are the SPI pins, CS can be any pin.' },
  lcd1602: { i2c: true, power: 'VBUS', what: 'lcd', note: 'VCC to 5V. Shares the two I2C wires with any other I2C part. Address 0x27 (some are 0x3F). On a 3.3V brain the backpack pulls SDA and SCL up to 5V: put a level shifter on those two wires.' },
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
  if (!B.spi) items.filter((i) => NEED[i.type] && (NEED[i.type].spi || NEED[i.type].cam || NEED[i.type].sd)).forEach((i) => problems.push(i.label + ' needs SPI, and the ' + B.name + ' has no free SPI pins.' + (B.builtIn ? ' Its SPI drives ' + B.builtIn + '.' : '')));
  const spiParts = !B.spi ? [] : items.filter((i) => NEED[i.type] && NEED[i.type].spi), i2cParts = items.filter((i) => NEED[i.type] && NEED[i.type].i2c);
  // 1. screens first: they need fixed pins. SPI0 = GP18 clock, GP19 data. I2C0 = GP4 SDA, GP5 SCL.
  const camParts = !B.spi ? [] : items.filter((i) => NEED[i.type] && NEED[i.type].cam), sdParts = !B.spi ? [] : items.filter((i) => NEED[i.type] && NEED[i.type].sd);
  if (spiParts.length || camParts.length || sdParts.length) { take(sp[0], 'SPI (clock)'); take(sp[1], 'SPI (data)'); }
  if (i2cParts.length || camParts.length) { take(ic[0], 'I2C (SDA)'); take(ic[1], 'I2C (SCL)'); }
  if (camParts.length || sdParts.length) take(sp[2], 'SPI (MISO)');
  sdParts.forEach((it) => { const k = it.key + ':cs', pin = over[k] != null ? over[k] : firstFree(ALLB.filter((x) => ADCB.indexOf(x) < 0)); if (pin != null) take(pin, it.label); else problems.push('Out of pins for ' + it.label + '. Take a part off.');
    rows.push({ it, roles: [{ role: 'clock', pin: sp[0], fixed: true }, { role: 'data', pin: sp[1], fixed: true }, { role: 'miso', pin: sp[2], fixed: true }, { role: 'cs', pin, kind: 'd', k }], power: NEED[it.type].power, note: NEED[it.type].note, N: NEED[it.type] }); });
  camParts.forEach((it) => { const k = it.key + ':cs', pin = over[k] != null ? over[k] : B.camCs.find(free) != null ? B.camCs.find(free) : firstFree(ALLB.filter((x) => ADCB.indexOf(x) < 0)); if (pin != null) take(pin, it.label);
    rows.push({ it, roles: [{ role: 'clock', pin: sp[0], fixed: true }, { role: 'data', pin: sp[1], fixed: true }, { role: 'miso', pin: sp[2], fixed: true }, { role: 'cs', pin, kind: 'd', k }, { role: 'SDA', pin: ic[0], fixed: true }, { role: 'SCL', pin: ic[1], fixed: true }], power: '3V3', note: NEED[it.type].note, N: NEED[it.type] }); });
  const spiPick = B.spiPick;
  spiParts.forEach((it, n) => {
    const N = NEED[it.type], p = spiPick[n] || [], roles = [['cs', p[0]], ['dc', p[1]], ['rst', p[2]]].map(([r, d]) => { const k = it.key + ':' + r, pin = over[k] != null ? over[k] : (d != null && free(d) ? d : firstFree(ALLB.filter((x) => ADCB.indexOf(x) < 0))); if (pin != null) take(pin, it.label); return { role: r, pin, kind: 'd', k }; });
    rows.push({ it, roles: [{ role: 'clock', pin: sp[0], fixed: true }, { role: 'data', pin: sp[1], fixed: true }].concat(roles), power: '3V3', note: 'Backlight (LED or BL) to 3V3. MISO is not needed.', N });
  });
  i2cParts.forEach((it) => rows.push({ it, roles: [{ role: 'SDA', pin: ic[0], fixed: true }, { role: 'SCL', pin: ic[1], fixed: true }], power: NEED[it.type].power || '3V3', note: NEED[it.type].note, N: NEED[it.type] }));
  // 2. her own pin choices are held before anything else is picked
  items.forEach((it) => { const N = NEED[it.type]; if (!N || !N.pins) return; N.pins.forEach(([r, kind]) => { const k = it.key + ':' + r; if (over[k] != null) { take(over[k], it.label); if (kind === 'enc' || kind === 'uart') take(over[k] + 1, it.label); if (kind === 'pwm') pwmSlices[B.pwm(over[k])] = it.label; } }); });
  // 3. analog, then wheels (two pins side by side), then sound and motors, then everything else
  const order = { a: 0, uart: 1, enc: 1, pwm: 2, d: 3 }, wants = [], dac = items.some((i) => i.type === 'i2sdac'); /* a jack with a DAC is wired to the DAC, not the brain */
  items.forEach((it) => { const N = NEED[it.type]; if (!N) return; if (N.pi) { if (!B.pi) problems.push(it.label + ' is an HDMI screen: it needs a Raspberry Pi brain, not a ' + B.name + '.'); return; } if (!N.pins || (N.viaDac && dac)) return; N.pins.forEach(([r, kind]) => wants.push({ it, r, kind })); });
  const got = {};
  wants.slice().sort((a, b) => order[a.kind] + ((NEED[a.it.type].opt || []).indexOf(a.r) > -1 ? 0.5 : 0) - order[b.kind] - ((NEED[b.it.type].opt || []).indexOf(b.r) > -1 ? 0.5 : 0)).forEach(({ it, r, kind }) => {
    const k = it.key + ':' + r; if (over[k] != null) { got[k] = over[k]; return; }
    let pin = null;
    if (kind === 'a') { pin = firstFree(ADCB.filter((p) => ALLB.indexOf(p) < 0)); if (pin == null) pin = firstFree(ADCB); if (pin == null && (NEED[it.type].opt || []).indexOf(r) > -1) { got[k] = null; return; } if (pin == null) problems.push(it.label + ' needs an analog pin, and the ' + B.name + (ADCB.length ? ' has only ' + ADCB.length + ' (' + ADCB.map(L).join(', ') + ').' : ' has none: add an analog board such as an ADS1115.')); }
    else if (kind === 'enc') { pin = ALLB.find((p) => ALLB.indexOf(p + 1) > -1 && ADCB.indexOf(p) < 0 && free(p) && free(p + 1)); if (pin != null) take(pin + 1, it.label); }
    else if (kind === 'uart') { const ok = (p) => (!B.uart || B.uart.indexOf(p) > -1) && ALLB.indexOf(p + 1) > -1 && free(p) && free(p + 1); /* TX and RX side by side; on a Pico a real UART pair */
      pin = ALLB.find((p) => ok(p) && ADCB.indexOf(p) < 0 && ADCB.indexOf(p + 1) < 0); if (pin == null) pin = ALLB.find(ok); if (pin != null) take(pin + 1, it.label); }
    else if (kind === 'pwm') { pin = ALLB.find((p) => ADCB.indexOf(p) < 0 && free(p) && B.pwm(p) > -1 && !pwmSlices[B.pwm(p)]); if (pin != null) pwmSlices[B.pwm(pin)] = it.label; }
    else pin = firstFree(ALLB.filter((p) => ADCB.indexOf(p) < 0)) != null ? firstFree(ALLB.filter((p) => ADCB.indexOf(p) < 0)) : firstFree(ADCB.filter((p) => ALLB.indexOf(p) > -1));
    if (pin == null && kind !== 'a') problems.push('Out of pins for ' + it.label + '. Take a part off, or use a Qwiic button board (one plug for many buttons).');
    if (pin != null) take(pin, it.label); got[k] = pin;
  });
  items.forEach((it) => { const N = NEED[it.type]; if (!N || !N.pins) return; if (N.viaDac && dac) { rows.push({ it, roles: [], power: null, note: 'Wired to the audio DAC: its LOUT, ROUT and AGND go to the tip, ring and sleeve. No brain pin.', N: Object.assign({}, N, { what: 'jack' }) }); return; }
    rows.push({ it, roles: N.pins.filter(([r]) => !((N.opt || []).indexOf(r) > -1 && got[it.key + ':' + r] == null)).map(([r, kind]) => ({ role: r, pin: got[it.key + ':' + r], kind, k: it.key + ':' + r, two: kind === 'enc' || kind === 'uart' })), power: N.power || null, note: N.note || '', N }); });
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
// ---------- what the code does: presets and tweaks shared by code.py, the Arduino sketch and Test It ----------
export const SCALES = { major: [0, 2, 4, 5, 7, 9, 11, 12], penta: [0, 2, 4, 7, 9, 12, 14, 16], minor: [0, 2, 3, 5, 7, 8, 10, 12] };
export const LIBURL = { ino: 'https://www.arduino.cc/en/software', cp: 'https://circuitpython.org/libraries', web: 'https://code.circuitpython.org/' };
// One door for every board: Arduino boards get a real .ino sketch, CircuitPython boards a code.py, both in the same 3 plain-English sections.
export function codeFor(plan, title, fn, B, tw) {
  title = String(title == null ? '' : title).replace(/&(amp|lt|gt|quot|#39);/g, (m, k) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" }[k])); /* the title comes from the page (HTML): plain text in the code file */
  B = B || BOARDS.pico;
  const c = fn === 'djfx' && (B.ino || B.cp) ? djfxCode(plan, title, B) : B.ino ? inoFor(plan, title, fn, B, tw || {}) : codePy(plan, title, fn, B, tw || {});
  if (!c.lang) { if (B.cp) { c.text = pySections(c.text); c.lang = 'py'; c.file = 'code.py'; } else { c.lang = 'txt'; c.file = 'pins.txt'; } }
  const pf = preflight(plan, B), cm = c.lang === 'ino' ? '// ' : '# ';
  if (c.lang === 'ino') { /* every part on the board gets its real library, used by this sketch or not, so the list is never "None" */
    const have = (c.libs = c.libs || []).map((l) => l.n), add = libsFor((plan.rows || []).map((r) => r.it.type), B).filter((l) => have.indexOf(l.n) < 0);
    if (add.length) { c.libs = c.libs.concat(add); const T = c.text.split('\n'), at = T.indexOf('// ===== 1. LIBRARIES =====');
      const inc = add.map((l) => '#include <' + l.inc + '>' + ' '.repeat(Math.max(1, 26 - l.inc.length)) + '// ' + (l.built ? 'built in' : '(install) "' + l.n + '" by ' + l.by));
      if (at > -1) T.splice(at + 2, 0, ...inc); else T.unshift('// Libraries to install (Sketch -> Include Library -> Manage Libraries): ' + add.filter((l) => !l.built).map((l) => '"' + l.n + '" by ' + l.by).join(', '));
      c.text = T.filter((x) => x.indexOf('// Nothing extra needed') < 0).join('\n').replace('//   4. No libraries to install.', '//   4. Install the libraries in section 1: Sketch -> Include Library -> Manage Libraries, search each name, Install.'); }
  }
  const fa = (plan.rows || []).filter((r) => r.it.action); /* part.action: what each control does, the same list Test It acts out */
  if (fa.length && c.lang !== 'txt') c.text = [cm + 'FUNCTIONS (set in Test It, tap a part, Function):'].concat(fa.map((r) => cm + '  ' + r.it.label + ' -> ' + ACTN(r.it.action))).join('\n') + '\n' + c.text;
  if (pf.length) c.text = pf.map((w) => cm + 'CHECK FIRST: ' + w).join('\n') + '\n' + c.text;
  return c;
}
// ---------- board profiles: one lookup for pins, logic voltage, code file and the library each part needs ----------
const LIB = (n, by, inc, built) => ({ n, by, inc, built: !!built }), GFX = LIB('Adafruit GFX Library', 'Adafruit', 'Adafruit_GFX.h');
export const INO_LIBS = {
  oled096: [LIB('Adafruit SSD1306', 'Adafruit', 'Adafruit_SSD1306.h'), GFX], tft28: [LIB('Adafruit ILI9341', 'Adafruit', 'Adafruit_ILI9341.h'), GFX], round128: [LIB('Adafruit GC9A01A', 'Adafruit', 'Adafruit_GC9A01A.h'), GFX],
  keypad44: [LIB('Keypad', 'Mark Stanley, Alexander Brevig', 'Keypad.h')], mat8: [LIB('LedControl', 'Eberhard Fahle', 'LedControl.h')], vl53: [LIB('Adafruit_VL53L0X', 'Adafruit', 'Adafruit_VL53L0X.h')],
  dfplayer: [LIB('DFRobotDFPlayerMini', 'DFRobot', 'DFRobotDFPlayerMini.h'), LIB('SoftwareSerial', 'Arduino (built in)', 'SoftwareSerial.h', true)], sdcard: [LIB('SD', 'Arduino (built in)', 'SD.h', true)], lcd1602: [LIB('LiquidCrystal I2C', 'Frank de Brabander', 'LiquidCrystal_I2C.h')],
  ring12: [LIB('Adafruit NeoPixel', 'Adafruit', 'Adafruit_NeoPixel.h')], servo: [LIB('Servo', 'Arduino (built in)', 'Servo.h', true)], arducam: [LIB('ArduCAM', 'ArduCAM', 'ArduCAM.h')]
};
export const PY_LIBS = { oled096: ['adafruit_displayio_ssd1306.mpy', 'adafruit_display_text'], tft28: ['adafruit_ili9341.mpy', 'adafruit_display_text'], round128: ['gc9a01.mpy', 'adafruit_display_text'],
  vl53: ['adafruit_vl53l0x.mpy'], mat8: ['adafruit_max7219'], ring12: ['neopixel.mpy'], servo: ['adafruit_motor'], i2sdac: [], inmp441: [], dfplayer: [], sdcard: [], lcd1602: ['lcd (from the Community Bundle)'] };
const PROF = (b, logic, lang, libs) => { const B = BOARDS[b]; return { key: b, board: B, name: B.name, pins: { left: B.left, right: B.right, all: B.all, adc: B.adc, i2c: B.i2c, spi: B.spi, label: B.lab }, logic, v5: B.v5, v3: B.v3, lang, file: lang === 'ino' ? 'casezero.ino' : 'code.py', libs }; };
export const BOARD_PROFILES = {
  uno: PROF('uno', '5V', 'ino', INO_LIBS), nano: PROF('nano', '5V', 'ino', INO_LIBS), promicro: PROF('promicro', '5V', 'ino', INO_LIBS),
  pico: PROF('pico', '3.3V', 'py', PY_LIBS), esp32c3: PROF('c3', '3.3V', 'py', PY_LIBS), esp32: PROF('esp32', '3.3V', 'py', PY_LIBS),
  esp32s3: PROF('s3', '3.3V', 'ino', Object.assign({}, INO_LIBS, { servo: [LIB('ESP32Servo', 'Kevin Harrington', 'ESP32Servo.h')], i2sdac: [LIB('ESP_I2S', 'Espressif (built in, Arduino-ESP32 3.x)', 'ESP_I2S.h', true)], inmp441: [LIB('ESP_I2S', 'Espressif (built in, Arduino-ESP32 3.x)', 'ESP_I2S.h', true)] })),
  esp32cam: PROF('cam', '3.3V', 'ino', Object.assign({}, INO_LIBS, { servo: [LIB('ESP32Servo', 'Kevin Harrington', 'ESP32Servo.h')] })),
  cyd: PROF('cyd', '3.3V', 'ino', Object.assign({}, INO_LIBS, { servo: [LIB('ESP32Servo', 'Kevin Harrington', 'ESP32Servo.h')], tft28: [], round128: [], dfplayer: [LIB('DFRobotDFPlayerMini', 'DFRobot', 'DFRobotDFPlayerMini.h')] }))
};
export const profileOf = (B) => Object.values(BOARD_PROFILES).find((p) => p.board === B) || null;
// the Arduino libraries a list of part types needs on brain B (deduped, in part order)
export function libsFor(types, B) { const P = profileOf(B) || (B && B.ino ? BOARD_PROFILES.uno : null), out = [];
  if (!P || P.lang !== 'ino') return out; (types || []).forEach((t) => (P.libs[t] || []).forEach((l) => { if (!out.some((o) => o.n === l.n)) out.push(l); })); return out; }
// ---------- preflight: run before code is exported or Wired is shown ----------
// Duplicate pins (shared I2C / SPI bus pins are fine), and 3.3V-only parts on a 5V brain (Elegoo / Arduino Uno).
export const V33 = { vl53: 'VL53L0X', inmp441: 'INMP441', oled096: 'OLED' };
export function preflight(plan, B) {
  B = B || BOARDS.pico; const out = [], by = {};
  (plan.rows || []).forEach((row) => row.roles.forEach((r) => { if (r.fixed || r.pin == null) return; [r.pin].concat(r.two ? [r.pin + 1] : []).forEach((p) => { (by[p] = by[p] || []).push(row.it.label); }); }));
  Object.keys(by).forEach((p) => { const who = Array.from(new Set(by[p])); if (by[p].length > 1) out.push('Pin ' + B.lab(+p) + ' is assigned twice (' + who.join(' and ') + '). Give one of them another pin.'); });
  const P = profileOf(B); if (P && P.logic === '5V') { const seen = {}, nm = B === BOARDS.uno ? 'Uno' : B === BOARDS.nano ? 'Nano' : 'Pro Micro'; (plan.rows || []).forEach((row) => { const n = V33[row.it.type]; if (n && !seen[row.it.label]) { seen[row.it.label] = 1;
    out.push('3.3V vs 5V: ' + row.it.label + ' (' + n + ') is a 3.3V part on a 5V ' + nm + '. Use 3.3V power, not 5V. ' + (B.v3 === '3V3' ? 'Wire its VCC to the ' + nm + '\'s 3V3 pin, never 5V' : 'The ' + nm + ' has no 3V3 pin: use a breakout with its own 3.3V regulator') + ', and pick a board with a level shifter (most Adafruit / STEMMA QT boards) for the 5V signal pins.'); } }); }
  return out;
}
// ---------- DJ FX: Loop, Echo, Spiral, Phaser on the first 4 buttons, a Beat wheel (CC 14) and a Wet/Dry knob or slider (CC 15) ----------
export const DJFX = [['Loop', 36, 'toggle'], ['Echo', 37, 'holdtoggle'], ['Spiral', 38, 'hold'], ['Phaser', 39, 'toggle']], BEATS = ['1/4', '1/2', '1', '2', '4', '8'];
export const DJMODE = { toggle: 'Toggle', holdtoggle: 'Hold/Toggle', hold: 'Hold' };
// Every control can carry an action (set in Test It, Function). DJ FX reads them: Loop/Echo/Spiral/Phaser buttons, a Beat wheel or knob, a Wet/Dry knob.
export const ACTS = [['loop', 'Loop'], ['echo', 'Echo'], ['spiral', 'Spiral'], ['phaser', 'Phaser'], ['beat', 'Beat'], ['wet', 'Wet/Dry'], ['step', 'Step 1/4'], ['note', 'Note'], ['macro', 'Macro'], ['custom', 'Custom']];
export const ACTN = (a) => (ACTS.find((x) => x[0] === a) || [0, 'Custom'])[1];
export const DJA = { loop: 0, echo: 1, spiral: 2, phaser: 3 };
function djParts(plan) { const keys = [], pots = [], encs = [];
  plan.rows.forEach((row) => { const it = row.it, tag = it.label.split(' ')[0], N = row.N, R = {}, a = it.action || null; row.roles.forEach((r) => { R[r.role] = r.pin; });
    if (N.what === 'button' && !it.step) row.roles.forEach((r) => { if (r.pin != null) keys.push([r.pin, row.roles.length > 1 ? tag + ' ' + r.role : tag, a]); });
    if (N.what === 'knob') ['turn', 'slide'].forEach((k) => { if (R[k] != null) pots.push([R[k], tag, a]); });
    if (N.what === 'wheel' && R['clk+dt'] != null) encs.push([R['clk+dt'], tag, a]); });
  if (plan.rows.some((r) => r.it.action)) { /* part.action decides: no guessing from the order */
    const fx = keys.filter((k) => DJA[k[2]] != null).map((k) => [k[0], k[1], DJA[k[2]]]), wheel = encs.find((e) => e[2] === 'beat') || null, beatPot = wheel ? null : pots.find((q) => q[2] === 'beat') || null, wet = pots.find((q) => q[2] === 'wet') || null;
    return { fx, wheel, beatPot, wet }; }
  const fx = keys.slice(0, 4).map((k, i) => [k[0], k[1], i]), wheel = encs[0] || null, beatPot = !wheel && pots.length > 1 ? pots[0] : null, wet = beatPot ? pots[1] : pots[0] || null;
  return { fx, wheel, beatPot, wet }; }
function djfxCode(plan, title, B) {
  const P = djParts(plan), pm = B === BOARDS.promicro, LB = B.lab, map = P.fx.map((k) => DJFX[k[2]][0] + ' = ' + LB(k[0]) + ' (note ' + DJFX[k[2]][1] + ', ' + DJMODE[DJFX[k[2]][2]] + ')'), NF = Math.max(1, P.fx.length), MD = { toggle: 0, holdtoggle: 1, hold: 2 };
  const head = ['DJ FX. ' + title, 'Brain: ' + B.name + '.', 'Buttons: ' + (map.length ? map.join(', ') : 'none yet: add up to 4 buttons in Parts') + '.',
    'Beat wheel: MIDI CC 14, ' + BEATS[0] + ' to ' + BEATS[BEATS.length - 1] + ' (' + (P.wheel ? 'click wheel ' + LB(P.wheel[0]) + '+' + LB(P.wheel[0] + 1) : P.beatPot ? 'knob ' + LB(P.beatPot[0]) : 'add a click wheel') + '). Wet/Dry: MIDI CC 15, 0 to 100% (' + (P.wet ? 'knob/slider ' + LB(P.wet[0]) : 'add a knob or slider') + ').',
    'In your DJ app (Mixxx, rekordbox, Serato, VirtualDJ), MIDI-learn each FX to its note and the beat / wet-dry to CC 14 / CC 15.'];
  plan.problems.forEach((p) => head.push('Fix first: ' + p));
  if (B.ino) { const ap = (n) => { const s = LB(n); return /^A\d/.test(s) ? s : s.replace(/^\D+/, ''); }, L = head.map((l) => '// ' + l), libs = pm ? [{ n: 'MIDIUSB', by: 'Gary Grewal', inc: 'MIDIUSB.h', built: false }] : [];
    if (pm) L.push('// Native USB MIDI: the Pro Micro shows up as a MIDI device. Install "MIDIUSB" by Gary Grewal (Sketch -> Include Library -> Manage Libraries).');
    else L.push('// The ' + B.name + ' has no native USB MIDI: it sends Serial MIDI at 115200 baud. Bridge it with the free Hairless MIDI (serial to MIDI) + loopMIDI (virtual MIDI port).');
    L.push('', '// ===== 1. LIBRARIES =====', pm ? '#include <MIDIUSB.h>' : '// none: Serial is built in', '', '// ===== 2. YOUR PINS =====');
    L.push('const int NFX = ' + P.fx.length + ';', P.fx.length ? 'const int FX_PIN[] = {' + P.fx.map((k) => ap(k[0])).join(', ') + '};' : 'const int FX_PIN[] = {0};');
    L.push('const char* FX_NAME[] = {' + (P.fx.length ? P.fx.map((k) => '"' + DJFX[k[2]][0] + '"').join(', ') : '""') + '};', 'const byte FX_NOTE[] = {' + (P.fx.length ? P.fx.map((k) => DJFX[k[2]][1]).join(', ') : '0') + '};', 'const byte FX_MODE[] = {' + (P.fx.length ? P.fx.map((k) => MD[DJFX[k[2]][2]]).join(', ') : '0') + '};  // 0 Toggle, 1 Hold/Toggle (tap latches, hold is momentary), 2 Hold');
    if (P.wheel) L.push('const int WHEEL_CLK = ' + ap(P.wheel[0]) + ', WHEEL_DT = ' + ap(P.wheel[0] + 1) + ';');
    if (P.beatPot) L.push('const int BEAT_POT = ' + ap(P.beatPot[0]) + ';');
    if (P.wet) L.push('const int WET_POT = ' + ap(P.wet[0]) + ';');
    L.push('', '// ===== 3. WHAT HAPPENS WHEN YOU PRESS THINGS =====', 'const char* BEATS[] = {"1/4", "1/2", "1", "2", "4", "8"};', 'int beat = 2, wet = -10, wheelWas = HIGH;', 'bool fxOn[' + NF + '], was[' + NF + '], skipUp[' + NF + '];', 'unsigned long downAt[' + NF + '];', '');
    L.push('void midi(byte cmd, byte a, byte b) {', pm ? '  midiEventPacket_t m = {(byte)(cmd >> 4), cmd, a, b};\n  MidiUSB.sendMIDI(m);\n  MidiUSB.flush();' : '  Serial.write(cmd); Serial.write(a); Serial.write(b);', '}');
    L.push('void fx(int i, bool on) { fxOn[i] = on; midi(on ? 0x90 : 0x80, FX_NOTE[i], on ? 127 : 0); }', 'void sendBeat() { midi(0xB0, 14, beat * 127 / 5); }', '');
    L.push('void setup() {', '  Serial.begin(115200);' + (pm ? '' : '  // Serial MIDI for Hairless'), '  for (int i = 0; i < NFX; i++) { pinMode(FX_PIN[i], INPUT_PULLUP); was[i] = HIGH; fxOn[i] = false; skipUp[i] = false; }');
    if (P.wheel) L.push('  pinMode(WHEEL_CLK, INPUT_PULLUP); pinMode(WHEEL_DT, INPUT_PULLUP); wheelWas = digitalRead(WHEEL_CLK);');
    L.push('}', '', 'void loop() {', '  for (int i = 0; i < NFX; i++) {', '    bool now = digitalRead(FX_PIN[i]);', '    if (now == was[i]) continue;', '    was[i] = now;',
      '    if (now == LOW) {  // pressed', '      downAt[i] = millis();', '      if (FX_MODE[i] == 0) fx(i, !fxOn[i]);', '      else if (!fxOn[i]) fx(i, true);', '      else { fx(i, false); skipUp[i] = true; }  // a latched Echo: tap again to stop', '    } else {  // released',
      '      if (skipUp[i]) { skipUp[i] = false; continue; }', '      if (FX_MODE[i] == 2) fx(i, false);', '      if (FX_MODE[i] == 1 && millis() - downAt[i] >= 300) fx(i, false);  // held: momentary. tapped: stays on', '    }', '  }');
    if (P.wheel) L.push('  int clk = digitalRead(WHEEL_CLK);', '  if (clk != wheelWas) { wheelWas = clk; if (clk == LOW) { int b = constrain(beat + (digitalRead(WHEEL_DT) != clk ? 1 : -1), 0, 5); if (b != beat) { beat = b; sendBeat(); } } }');
    if (P.beatPot) L.push('  int b = analogRead(BEAT_POT) * 6L / 1024;', '  if (b != beat) { beat = b; sendBeat(); }');
    if (P.wet) L.push('  int v = analogRead(WET_POT) * 100L / 1023;', '  if (abs(v - wet) >= 2) { wet = v; midi(0xB0, 15, v * 127 / 100); }  // Wet/Dry %');
    L.push('  delay(3);', '}', '');
    return { text: L.join('\n'), libs, lang: 'ino', file: 'casezero.ino' }; }
  const PF = B.cp, L = head.map((l) => '# ' + l);
  const pn = (n) => (B === BOARDS.pico ? 'board.GP' + n : PF + n);
  L.push('# Native USB MIDI (adafruit_midi): the ' + B.name + ' shows up as a MIDI device. Copy adafruit_midi from the CircuitPython Library Bundle into CIRCUITPY/lib.');
  if (B !== BOARDS.pico) L.push('# Native USB MIDI needs a board with USB built into the chip (Pico, ESP32-S2/S3). A ' + B.name + ' prints the MIDI it would send instead.');
  L.push('', '# ===== 1. LIBRARIES =====', 'import time', 'import board', 'import digitalio');
  if (P.wet || P.beatPot) L.push('import analogio'); if (P.wheel) L.push('import rotaryio');
  L.push('try:', '    import usb_midi', '    import adafruit_midi', '    from adafruit_midi.note_on import NoteOn', '    from adafruit_midi.note_off import NoteOff', '    from adafruit_midi.control_change import ControlChange', '    midi = adafruit_midi.MIDI(midi_out=usb_midi.ports[1], out_channel=0)', 'except Exception as err:', '    midi = None', '    print("NOCIV no USB MIDI here:", err)', '');
  L.push('# ===== 2. YOUR PINS =====', 'FX = (' + P.fx.map((k) => '("' + DJFX[k[2]][0] + '", ' + DJFX[k[2]][1] + ', "' + DJFX[k[2]][2] + '")').join(', ') + (P.fx.length === 1 ? ',' : '') + ')', 'FX_PINS = (' + P.fx.map((k) => pn(k[0])).join(', ') + (P.fx.length === 1 ? ',' : '') + ')');
  L.push('btns = []', 'for p in FX_PINS:', '    b = digitalio.DigitalInOut(p)', '    b.switch_to_input(pull=digitalio.Pull.UP)', '    btns.append(b)');
  if (P.wheel) L.push('wheel = rotaryio.IncrementalEncoder(' + pn(P.wheel[0]) + ', ' + pn(P.wheel[0] + 1) + ')');
  if (P.beatPot) L.push('beat_pot = analogio.AnalogIn(' + pn(P.beatPot[0]) + ')');
  if (P.wet) L.push('wet_pot = analogio.AnalogIn(' + pn(P.wet[0]) + ')');
  L.push('', '# ===== 3. WHAT HAPPENS WHEN YOU PRESS THINGS =====', 'BEATS = ("1/4", "1/2", "1", "2", "4", "8")', 'on = [False] * len(btns)', 'was = [True] * len(btns)', 'skip_up = [False] * len(btns)', 'down_at = [0.0] * len(btns)', 'beat = 2', 'wet = -10', 'last_pos = 0', '',
    'def send(msg, text):', '    if midi:', '        midi.send(msg)', '    print("NOCIV", text)', '',
    'def fx(i, state):', '    on[i] = state', '    name, note, mode = FX[i]', '    send(NoteOn(note, 127) if state else NoteOff(note, 0), name + (" on" if state else " off"))', '',
    'def send_beat():', '    send(ControlChange(14, beat * 127 // 5), "Beat " + BEATS[beat])', '',
    'print("NOCIV DJ FX ready")', 'while True:', '    for i, b in enumerate(btns):', '        down = not b.value', '        if down == (not was[i]):', '            continue', '        was[i] = not down', '        mode = FX[i][2]',
    '        if down:', '            down_at[i] = time.monotonic()', '            if mode == "toggle":', '                fx(i, not on[i])', '            elif not on[i]:', '                fx(i, True)', '            else:', '                fx(i, False)  # a latched Echo: tap again to stop', '                skip_up[i] = True',
    '        else:', '            if skip_up[i]:', '                skip_up[i] = False', '            elif mode == "hold":', '                fx(i, False)', '            elif mode == "holdtoggle" and time.monotonic() - down_at[i] >= 0.3:', '                fx(i, False)  # held: momentary. tapped: stays on');
  if (P.wheel) L.push('    pos = wheel.position', '    if pos != last_pos:', '        nb = max(0, min(5, beat + (1 if pos > last_pos else -1)))', '        last_pos = pos', '        if nb != beat:', '            beat = nb', '            send_beat()');
  if (P.beatPot) L.push('    nb = min(5, beat_pot.value * 6 // 65536)', '    if nb != beat:', '        beat = nb', '        send_beat()');
  if (P.wet) L.push('    v = wet_pot.value * 100 // 65535', '    if abs(v - wet) >= 2:', '        wet = v', '        send(ControlChange(15, v * 127 // 100), "Wet/Dry " + str(v) + "%")');
  L.push('    time.sleep(0.003)', '');
  return { text: L.join('\n'), libs: ['adafruit_midi'], lang: 'py', file: 'code.py' };
}
function pySections(t) {
  const L = t.split('\n'), at = (re) => L.findIndex((l) => re.test(l));
  const i3 = at(/^show\("(Ready|Macro pad ready)"\)$|^# ---- (4-Button Macro Pad|Desk Timer|Mini Synth|Voice Sampler|MIDI Controller|Soundboard)/);
  if (i3 > -1) L.splice(i3, 0, '# ===== 3. WHAT HAPPENS WHEN YOU PRESS THINGS =====', '# The loop at the bottom runs forever: it checks every part and reacts.', '');
  const i2 = at(/^status = None/); if (i2 > -1) L.splice(i2, 0, '# ===== 2. YOUR PINS =====', '# Which wire goes to which pin. They match the wiring guide in the app.', '');
  const i1 = at(/^import time$/); if (i1 > -1) L.splice(i1, 0, '# ===== 1. LIBRARIES =====', '# Code other people wrote that this file borrows. The ones that are not built in go in CIRCUITPY/lib (step 2 above).');
  return L.join('\n');
}
const cStr = (s) => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
// ---------- the Arduino sketch (.ino): Elegoo / Arduino Uno, Nano, Pro Micro and the Cheap Yellow Display ----------
function inoFor(plan, title, fn, B, tw) {
  const ap = (n) => { const s = B.lab(n); return /^A\d/.test(s) ? s : s.replace(/^\D+/, ''); };
  const pm = B === BOARDS.promicro, cyd = B === BOARDS.cyd, cam = B === BOARDS.cam, keys = [], pots = [], steps = [], encs = [], outs = [], pirs = [], mats = [], notes = [], tofs = [], cams = [];
  let screen = null, mx = null, dfp = null, sdc = null, lcd = false;
  plan.rows.forEach((row) => {
    const it = row.it, tag = it.label.split(' ')[0], N = row.N, R = {}; row.roles.forEach((r) => { R[r.role] = r.pin; });
    if (N.what === 'motion' && R.out != null) { pirs.push([R.out, tag]); return; }
    if (N.what === 'keypad') { if (!mats.length) mats.push({ R, tag }); return; }
    if (N.what === 'distance') { tofs.push(tag); return; }
    if (N.what === 'camera') { if (!cams.length && R.cs != null) cams.push([R.cs, tag]); return; }
    if (N.what === 'matrix8') { if (!mx) mx = R; return; }
    if (N.what === 'mp3') { if (dfp == null && R['tx+rx'] != null) dfp = R['tx+rx']; return; }
    if (N.what === 'sd') { if (sdc == null && R.cs != null) sdc = R.cs; return; }
    if (N.what === 'lcd') { lcd = true; return; }
    if (N.what === 'i2sout' || N.what === 'i2sin') { notes.push(it.label + ': ' + row.roles.map((r) => r.role + ' ' + (r.pin == null ? '?' : B.lab(r.pin)) + (r.two ? ' + ' + B.lab(r.pin + 1) : '')).join(', ') + (cyd ? ' (wired; I2S sound needs the ESP32 I2S driver, not used by this sketch)' : '. The ' + B.name + ' has no I2S hardware, so this sketch cannot use it: a DFPlayer Mini plays sound files instead.')); return; }
    if (N.what === 'jack') return;
    if (N.spi || N.i2c) { if (!screen) screen = { N, R, label: it.label }; return; }
    if (N.what === 'button' && it.step && row.roles.length === 1 && row.roles[0].pin != null) { steps.push([row.roles[0].pin, tag]); return; }
    if (N.what === 'button') row.roles.forEach((r) => { if (r.pin != null) keys.push([r.pin, row.roles.length > 1 ? tag + ' ' + r.role : tag]); });
    if (N.what === 'knob' && R.turn != null) pots.push([R.turn, tag]);
    if (N.what === 'knob' && R.slide != null) pots.push([R.slide, tag]);
    if (N.what === 'stick') { if (R.x != null) pots.push([R.x, tag + ' x']); if (R.y != null) pots.push([R.y, tag + ' y']); if (R.press != null) keys.push([R.press, tag + ' press']); }
    if (N.what === 'wheel') { if (R['clk+dt'] != null) encs.push([R['clk+dt'], tag]); if (R.press != null) keys.push([R.press, tag + ' press']); }
    if (['led', 'ring', 'sound', 'servo'].indexOf(N.what) > -1 && row.roles.length && row.roles[0].pin != null && !outs.some((o) => o[0] === N.what)) outs.push([N.what, row.roles[0].pin, tag]);
  });
  const out = (w) => outs.find((o) => o[0] === w), snd = out('sound'), drv = screen && screen.N.driver;
  const mode = ['synth', 'macro', 'midi', 'timer', 'sound'].indexOf(fn) > -1 ? fn : 'test', step = tw.btn === 'step', sc = SCALES[tw.scale] || SCALES.major;
  const libs = []; const lib = (n, by, inc, built) => libs.push({ n, by, inc, built: !!built });
  if (cyd) { lib('TFT_eSPI', 'Bodmer', 'TFT_eSPI.h'); lib('XPT2046_Touchscreen', 'Paul Stoffregen', 'XPT2046_Touchscreen.h'); }
  else if (drv === 'ssd1306') { lib('Adafruit SSD1306', 'Adafruit', 'Adafruit_SSD1306.h'); lib('Adafruit GFX Library', 'Adafruit', 'Adafruit_GFX.h'); }
  else if (drv === 'ili9341') { lib('Adafruit ILI9341', 'Adafruit', 'Adafruit_ILI9341.h'); lib('Adafruit GFX Library', 'Adafruit', 'Adafruit_GFX.h'); }
  else if (drv === 'gc9a01') { lib('Adafruit GC9A01A', 'Adafruit', 'Adafruit_GC9A01A.h'); lib('Adafruit GFX Library', 'Adafruit', 'Adafruit_GFX.h'); }
  if (mats.length) lib('Keypad', 'Mark Stanley, Alexander Brevig', 'Keypad.h');
  if (lcd) lib('LiquidCrystal I2C', 'Frank de Brabander', 'LiquidCrystal_I2C.h');
  if (tofs.length) lib('Adafruit_VL53L0X', 'Adafruit', 'Adafruit_VL53L0X.h');
  if (cams.length) lib('ArduCAM', 'ArduCAM', 'ArduCAM.h');
  if (mx) lib('LedControl', 'Eberhard Fahle', 'LedControl.h');
  if (dfp != null) { if (!cyd) lib('SoftwareSerial', 'Arduino (built in)', 'SoftwareSerial.h', true); lib('DFRobotDFPlayerMini', 'DFRobot', 'DFRobotDFPlayerMini.h'); }
  if (sdc != null) lib('SD', 'Arduino (built in)', 'SD.h', true);
  if (out('ring')) lib('Adafruit NeoPixel', 'Adafruit', 'Adafruit_NeoPixel.h');
  if (out('servo')) lib(cyd || cam ? 'ESP32Servo' : 'Servo', cyd || cam ? 'Kevin Harrington' : 'Arduino (built in)', cyd || cam ? 'ESP32Servo.h' : 'Servo.h', !(cyd || cam));
  if (mode === 'macro' && pm) lib('Keyboard', 'Arduino (built in)', 'Keyboard.h', true);
  if (mode === 'midi' && pm) lib('MIDIUSB', 'Gary Grewal', 'MIDIUSB.h');
  const boardPick = pm ? 'SparkFun Pro Micro (or Arduino Leonardo)' : cam ? 'AI Thinker ESP32-CAM (add the ESP32 boards first, upload through the ESP32-CAM-MB)' : cyd ? 'ESP32 Dev Module (add the ESP32 boards first: Tools -> Board -> Boards Manager -> esp32)' : B === BOARDS.nano ? 'Arduino Nano (Processor: ATmega328P, try "Old Bootloader" if upload fails)' : 'Arduino Uno';
  const L = [];
  L.push('// NOCIV Case Zero sketch. ' + title, '// Brain: ' + B.name + '. Arduino language (.ino).', '//',
    '// How to put it on the board:', '//   1. Install the free Arduino IDE: https://www.arduino.cc/en/software',
    '//   2. Save this file as casezero/casezero.ino (the folder and the file must have the same name).',
    '//   3. Tools -> Board -> ' + boardPick + '. Tools -> Port -> the one that appears when you plug it in.',
    libs.some((l) => !l.built) ? '//   4. Install the libraries in section 1: Sketch -> Include Library -> Manage Libraries, search each name, Install.' : '//   4. No libraries to install.',
    '//   5. Press Upload (the arrow). Open Tools -> Serial Monitor at 115200 to see every press.', '//');
  if (cyd) L.push('// CYD: TFT_eSPI needs the CYD settings. Copy the CYD User_Setup.h (github.com/witnessmenow/ESP32-Cheap-Yellow-Display, DisplayConfig)', '//   into the TFT_eSPI library folder, replacing the one there. Spare pins for your parts: GPIO22 and GPIO27 (CN1 plug), GPIO35 (P3, input only), GPIO21 (P3, shared with the backlight on some boards).', '//   Already on the board: speaker GPIO26, RGB LED GPIO4/16/17, light sensor GPIO34, SD card on its own SPI.', '//');
  plan.problems.forEach((p) => L.push('// Fix first: ' + p));
  notes.forEach((n) => L.push('// ' + n));
  L.push('', '// ===== 1. LIBRARIES =====', '// Code other people wrote that this sketch borrows. (install) = install it once in the Library Manager.');
  const incs = []; libs.forEach((l) => { if (incs.indexOf(l.inc) < 0) { incs.push(l.inc); L.push('#include <' + l.inc + '>' + ' '.repeat(Math.max(1, 26 - l.inc.length)) + '// ' + (l.built ? 'built in' : '(install) "' + l.n + '" by ' + l.by)); } });
  if ((drv === 'ssd1306' && !cyd) || lcd || tofs.length || cams.length) L.push('#include <Wire.h>                 // built in: the 2-wire I2C bus');
  if (cyd || cams.length || sdc != null) L.push('#include <SPI.h>                  // built in: the SPI bus');
  if (cams.length) L.push('// ArduCAM: open the library folder, edit memorysaver.h and keep only #define OV2640_MINI_2MP switched on.');
  if (!incs.length && !cyd) L.push('// Nothing extra needed: everything here is built into Arduino.');
  L.push('', '// ===== 2. YOUR PINS =====', '// Which wire goes to which pin. They match the wiring guide in the app. Change a number here if you used another pin.');
  const arr = (nm, list, f) => list.length && L.push('const int ' + nm + '[] = {' + list.map(f).join(', ') + '};');
  const names = (nm, list) => list.length && L.push('const char* ' + nm + '[] = {' + list.map((k) => cStr(k[1])).join(', ') + '};');
  if (keys.length) { L.push('// Buttons: one leg to the pin, the other to GND. Pressed reads LOW.'); arr('BTN_PIN', keys, (k) => ap(k[0])); names('BTN_NAME', keys); L.push('const int NBTN = ' + keys.length + ';'); }
  if (pots.length) { L.push('// Knobs, sliders, sticks: the middle leg to the pin. Read 0 to 100.'); arr('POT_PIN', pots, (k) => ap(k[0])); names('POT_NAME', pots); L.push('const int NPOT = ' + pots.length + ';'); }
  if (steps.length) { L.push('// Stepped Buttons: each press steps 1/4 -> 2/4 -> 3/4 -> 4/4 (25, 50, 75, 100).'); arr('STEP_PIN', steps, (k) => ap(k[0])); names('STEP_NAME', steps); L.push('const int NSTEP = ' + steps.length + ';'); }
  if (encs.length) { L.push('// Click wheels: CLK and DT sit side by side.'); L.push('const int ENC_PIN[][2] = {' + encs.map((e) => '{' + ap(e[0]) + ', ' + ap(e[0] + 1) + '}').join(', ') + '};'); names('ENC_NAME', encs); L.push('const int NENC = ' + encs.length + ';'); }
  if (pirs.length) { arr('PIR_PIN', pirs, (k) => ap(k[0])); names('PIR_NAME', pirs); L.push('const int NPIR = ' + pirs.length + ';'); }
  outs.forEach(([w, p, t]) => L.push('const int ' + { led: 'LED_PIN', ring: 'RING_PIN', sound: 'SOUND_PIN', servo: 'SERVO_PIN' }[w] + ' = ' + ap(p) + ';  // ' + t));
  if (cyd && !snd) L.push('const int SOUND_PIN = 26;  // the CYD speaker plug');
  const SP = snd || cyd;
  if (mats.length) { const R = mats[0].R; L.push('// 4x4 keypad: 4 row wires, 4 column wires.', 'byte ROW_PIN[4] = {' + [1, 2, 3, 4].map((i) => ap(R['row' + i])).join(', ') + '};', 'byte COL_PIN[4] = {' + [1, 2, 3, 4].map((i) => ap(R['col' + i])).join(', ') + '};', "char PAD_KEYS[4][4] = {{'1','2','3','A'},{'4','5','6','B'},{'7','8','9','C'},{'*','0','#','D'}};", 'Keypad pad = Keypad(makeKeymap(PAD_KEYS), ROW_PIN, COL_PIN, 4, 4);'); }
  if (screen && !cyd) { const R = screen.R; L.push('// Screen: ' + screen.label);
    if (drv === 'ssd1306') L.push('Adafruit_SSD1306 screen(128, 64, &Wire, -1);  // SDA ' + B.lab(B.i2c[0]) + ', SCL ' + B.lab(B.i2c[1]));
    else L.push((drv === 'ili9341' ? 'Adafruit_ILI9341' : 'Adafruit_GC9A01A') + ' screen(' + ap(R.cs) + ', ' + ap(R.dc) + ', ' + ap(R.rst) + ');  // CS, DC, RST. SCK ' + B.lab(B.spi[0]) + ', MOSI ' + B.lab(B.spi[1])); }
  if (lcd) L.push('// 1602 LCD on I2C: SDA ' + B.lab(B.i2c[0]) + ', SCL ' + B.lab(B.i2c[1]) + ', VCC to ' + B.v5, 'LiquidCrystal_I2C lcd(0x27, 16, 2);  // address 0x27 (some are 0x3F), 16 letters, 2 lines');
  if (tofs.length) L.push('// Laser distance (VL53L0X) on I2C: SDA ' + B.lab(B.i2c[0]) + ', SCL ' + B.lab(B.i2c[1]) + ', VCC to ' + B.v3, 'Adafruit_VL53L0X tof;', 'const char* TOF_NAME = ' + cStr(tofs[0]) + ';', 'bool tofOk = false;', 'unsigned long tofNext = 0;');
  if (cams.length) L.push('// SPI camera (Arducam Mini 2MP): SCK ' + B.lab(B.spi[0]) + ', MOSI ' + B.lab(B.spi[1]) + ', MISO ' + B.lab(B.spi[2]) + ', CS below, SDA ' + B.lab(B.i2c[0]) + ', SCL ' + B.lab(B.i2c[1]), 'const int CAM_CS = ' + ap(cams[0][0]) + ';', 'ArduCAM cam(OV2640, CAM_CS);');
  if (mx) L.push('// 8x8 LED matrix (MAX7219): DIN ' + B.lab(mx.din) + ', CLK ' + B.lab(mx.clk) + ', CS ' + B.lab(mx.cs), 'LedControl leds = LedControl(' + ap(mx.din) + ', ' + ap(mx.clk) + ', ' + ap(mx.cs) + ', 1);  // DIN, CLK, CS, 1 matrix');
  if (dfp != null) L.push('// DFPlayer Mini: DF_TX goes through a 1K resistor to its RX, its TX comes back to DF_RX. Files 0001.mp3, 0002.mp3... on its microSD card.', 'const int DF_TX = ' + ap(dfp) + ';', 'const int DF_RX = ' + ap(dfp + 1) + ';', cyd ? 'HardwareSerial dfSerial(2);' : 'SoftwareSerial dfSerial(DF_RX, DF_TX);  // RX, TX', 'DFRobotDFPlayerMini player;', 'bool playerOk = false;');
  if (sdc != null) L.push('// MicroSD reader: SCK ' + B.lab(B.spi[0]) + ', MOSI ' + B.lab(B.spi[1]) + ', MISO ' + B.lab(B.spi[2]) + ', CS below', 'const int SD_CS = ' + ap(sdc) + ';', 'bool sdOk = false;');
  if (cyd) L.push('TFT_eSPI screen;                    // the built-in 2.8 in screen', 'SPIClass touchBus(VSPI);', 'XPT2046_Touchscreen touch(33, 36);  // touch: CS 33, IRQ 36 (MOSI 32, MISO 39, CLK 25)');
  if (out('ring')) L.push('Adafruit_NeoPixel ring(12, RING_PIN, NEO_GRB + NEO_KHZ800);');
  if (out('servo')) L.push('Servo arm;');
  L.push('', '// ===== 3. WHAT HAPPENS WHEN YOU PRESS THINGS =====');
  const what = { test: 'Pin Test: every press, turn and slide prints "NOCIV name value" so you can check each wire.', synth: 'Synth: each button plays a note of the scale on the speaker. Knob 1 moves the pitch.', macro: 'USB Macro Pad: each button sends a shortcut (copy, paste, undo, save).', midi: 'MIDI: each button sends a MIDI note, each knob a MIDI CC (1, 2, 3...).', timer: 'Timer: button 1 starts and pauses, hold it 1 s to reset. Turn the wheel to set the minutes. It beeps at 00:00.', sound: 'Soundboard: each button plays its own little jingle.' }[mode];
  L.push('// ' + what);
  if (['synth', 'midi', 'sound'].indexOf(mode) > -1) L.push('const int SCALE[] = {' + sc.join(', ') + '};  // ' + ({ major: 'Major', penta: 'Pentatonic', minor: 'Minor' }[tw.scale] || 'Major') + ' scale, in steps above middle C', 'const bool STEP_MODE = ' + step + ';     // true: each press plays one short 1/4 note. false: the note plays while you hold the button.', 'int transpose = 0;');
  if (mode === 'macro') L.push('const bool MAC = ' + !!tw.mac + ';  // true on a Mac: Cmd instead of Ctrl', "const char SHORTCUT[] = {'c', 'v', 'z', 's'};", 'const char* WHAT[] = {"copy", "paste", "undo", "save"};');
  if (mode === 'macro' && !pm) L.push('// The ' + B.name + ' cannot act as a USB keyboard (a Pro Micro or a Pico can). Here each button prints the shortcut it would send.');
  if (mode === 'midi' && !pm) L.push('// The ' + B.name + ' is not a USB MIDI device. It sends MIDI over the USB cable at 115200: run the free Hairless MIDI bridge on your computer.');
  if (mode === 'timer') L.push('int minutes = ' + (tw.min || 25) + ';', 'long remaining = minutes * 60L;', 'bool running = false;', 'unsigned long tick = 0, downAt = 0;');
  if (keys.length) L.push('bool btnWas[NBTN];');
  if (pots.length) L.push('int potWas[NPOT];');
  if (steps.length) L.push('bool stepWas[NSTEP];', 'int stepAt[NSTEP];');
  if (encs.length) L.push('int encWas[NENC];', 'long encPos[NENC];');
  if (pirs.length) L.push('bool pirWas[NPIR];');
  L.push('unsigned long noteOff = 0;  // when a short note ends', 'int noteOn = -1;', '');
  // show(): the screen (if any) and the Serial Monitor
  L.push('void show(String text) {');
  if (drv === 'ssd1306' && !cyd) L.push('  screen.clearDisplay();', '  screen.setTextSize(2);', '  screen.setTextColor(SSD1306_WHITE);', '  screen.setCursor(0, 20);', '  screen.println(text);', '  screen.display();');
  else if (cyd) L.push('  screen.fillRect(0, 100, 320, 40, TFT_BLACK);', '  screen.drawString(text, 10, 104, 4);');
  else if (screen) L.push('  screen.fillRect(0, 100, 320, 40, 0x0000);', '  screen.setCursor(8, 108);', '  screen.setTextSize(3);', '  screen.setTextColor(0xFFFF);', '  screen.print(text);');
  else if (!lcd) L.push('  // no screen: the Serial Monitor shows it');
  if (lcd) L.push('  lcd.clear();', '  lcd.setCursor(0, 0);', '  lcd.print(text.substring(0, 16));', '  if (text.length() > 16) { lcd.setCursor(0, 1); lcd.print(text.substring(16, 32)); }');
  L.push('}', '', 'void say(String name, int value) {  // "NOCIV B1 1": the live test in the app reads these lines');
  L.push(mode === 'midi' && !pm ? '  // (quiet in MIDI mode: the serial cable carries the MIDI)' : '  Serial.print("NOCIV "); Serial.print(name); Serial.print(" "); Serial.println(value);', '}', '');
  if (['synth', 'midi', 'sound'].indexOf(mode) > -1) L.push('int noteNumber(int n) { return 60 + SCALE[n % 8] + 12 * (n / 8) + transpose; }  // 60 = middle C', 'float noteHz(int n) { return 440.0 * pow(2, (noteNumber(n) - 69) / 12.0); }', '');
  if (mode === 'midi') L.push('void midi(byte cmd, byte a, byte b) {', pm ? '  midiEventPacket_t m = {(byte)(cmd >> 4), cmd, a, b};\n  MidiUSB.sendMIDI(m);\n  MidiUSB.flush();' : '  Serial.write(cmd); Serial.write(a); Serial.write(b);', '}', '');
  if (mode === 'timer') L.push('String clock() { char t[8]; sprintf(t, "%02ld:%02ld", remaining / 60, remaining % 60); return String(t); }', '');
  const beep = (hz, ms) => (SP ? 'tone(SOUND_PIN, ' + hz + ', ' + ms + ');' : '/* add a buzzer to hear it */');
  // press / release
  L.push('// A button (or a keypad key) went down. n = which one.', 'void press(int n, String name) {', '  say(name, 1);');
  if (dfp != null) L.push('  if (playerOk) player.play(n + 1);  // button 1 plays 0001.mp3, button 2 0002.mp3...');
  if (mx) L.push('  leds.clearDisplay(0);', '  leds.setLed(0, (n / 8) % 8, n % 8, true);  // one light per button');
  if (out('led')) L.push('  digitalWrite(LED_PIN, !digitalRead(LED_PIN));');
  if (out('ring')) L.push('  ring.fill(ring.Color(200, 40, 30)); ring.show();');
  if (mode === 'test') { L.push('  show(name);'); if (SP) L.push('  ' + beep('330 + 60 * n', 80)); if (out('servo') && !pots.length) L.push('  arm.write(arm.read() < 45 ? 90 : 0);'); }
  if (mode === 'synth') L.push('  show(name + " " + String((int)noteHz(n)) + " Hz");', SP ? '  if (STEP_MODE) tone(SOUND_PIN, noteHz(n), 250); else tone(SOUND_PIN, noteHz(n));' : '  // add a buzzer or the jack (Parts) to hear it', '  noteOn = n;');
  if (mode === 'sound') L.push('  show("Sound " + String(n + 1));', SP ? '  if (STEP_MODE) { tone(SOUND_PIN, noteHz(n), 250); return; }\n  for (int i = 0; i < 3; i++) { tone(SOUND_PIN, noteHz(n + i * 2), 120); delay(140); }  // its jingle: 3 quick notes' : '  // add a buzzer (Parts) to hear it');
  if (mode === 'midi') L.push('  midi(0x90, noteNumber(n), 100);  // note on, loud', '  show("Note " + String(noteNumber(n)));', '  noteOn = n;', '  if (STEP_MODE) noteOff = millis() + 250;');
  if (mode === 'macro') L.push('  if (n > 3) { show(name); return; }', '  show(String(MAC ? "Cmd+" : "Ctrl+") + SHORTCUT[n] + " " + WHAT[n]);', pm ? '  Keyboard.press(MAC ? KEY_LEFT_GUI : KEY_LEFT_CTRL);\n  Keyboard.press(SHORTCUT[n]);\n  delay(20);\n  Keyboard.releaseAll();' : '  Serial.println(String("would send ") + (MAC ? "Cmd+" : "Ctrl+") + SHORTCUT[n]);');
  if (mode === 'timer') L.push('  if (n == 0) downAt = millis();');
  L.push('}', '', '// It came back up.', 'void release(int n, String name) {', '  say(name, 0);');
  if (out('ring')) L.push('  ring.clear(); ring.show();');
  if (mode === 'synth' && SP) L.push('  if (!STEP_MODE && noteOn == n) { noTone(SOUND_PIN); noteOn = -1; }');
  if (mode === 'midi') L.push('  if (!STEP_MODE && noteOn == n) { midi(0x80, noteNumber(n), 0); noteOn = -1; }');
  if (mode === 'timer') L.push('  if (n != 0) return;', '  if (millis() - downAt >= 1000) { running = false; remaining = minutes * 60L; show(clock()); return; }  // held 1 s: reset', '  running = !running; tick = millis();', '  show(running ? clock() : clock() + " paused");');
  L.push('}', '', '// A knob moved, or a Stepped Button stepped. value is 0 to 100.', 'void dial(int n, String name, int value) {', '  say(name, value);');
  if (mode === 'test') { L.push('  show(name + " " + String(value));'); if (out('servo')) L.push('  if (n == 0) arm.write(value * 180 / 100);'); }
  if (mode === 'synth' || mode === 'sound') L.push('  if (n == 0) { transpose = value * 24 / 100 - 12; show("Pitch " + String(transpose)); }');
  if (mode === 'midi') L.push('  midi(0xB0, 1 + n, value * 127 / 100);  // CC 1, 2, 3...', '  show("CC " + String(1 + n) + " " + String(value));');
  if (mode === 'macro') L.push('  show(name + " " + String(value));');
  L.push('}', '', '// A click wheel clicked one step. dir is +1 or -1.', 'void wheel(int n, String name, long pos, int dir) {', '  say(name, pos);');
  if (mode === 'timer') L.push('  if (!running) { minutes = constrain(minutes + dir, 1, 99); remaining = minutes * 60L; show(clock()); }');
  else if (mode === 'synth' || mode === 'sound' || mode === 'midi') L.push('  transpose = constrain(transpose + dir, -12, 12);', '  show("Pitch " + String(transpose));');
  else L.push('  show(name + " " + String(pos));');
  L.push('}', '', 'void setup() {', mode === 'midi' && !pm ? '  Serial.begin(115200);  // MIDI bytes for the Hairless bridge' : '  Serial.begin(115200);');
  if (keys.length) L.push('  for (int i = 0; i < NBTN; i++) { pinMode(BTN_PIN[i], INPUT_PULLUP); btnWas[i] = HIGH; }');
  if (steps.length) L.push('  for (int i = 0; i < NSTEP; i++) { pinMode(STEP_PIN[i], INPUT_PULLUP); stepWas[i] = HIGH; stepAt[i] = 0; }');
  if (pots.length) L.push('  for (int i = 0; i < NPOT; i++) potWas[i] = -10;');
  if (encs.length) L.push('  for (int i = 0; i < NENC; i++) { pinMode(ENC_PIN[i][0], INPUT_PULLUP); pinMode(ENC_PIN[i][1], INPUT_PULLUP); encWas[i] = digitalRead(ENC_PIN[i][0]); encPos[i] = 0; }');
  if (pirs.length) L.push('  for (int i = 0; i < NPIR; i++) { pinMode(PIR_PIN[i], INPUT); pirWas[i] = LOW; }');
  if (out('led')) L.push('  pinMode(LED_PIN, OUTPUT);');
  if (out('ring')) L.push('  ring.begin(); ring.setBrightness(50); ring.show();');
  if (out('servo')) L.push('  arm.attach(SERVO_PIN);');
  if (mode === 'macro' && pm) L.push('  Keyboard.begin();');
  if (lcd) L.push('  lcd.init();', '  lcd.backlight();');
  if (tofs.length) L.push('  tofOk = tof.begin();', '  say("Distance", tofOk ? 1 : 0);  // 0: check SDA, SCL and 3V3');
  if (cams.length) L.push('  pinMode(CAM_CS, OUTPUT);', '  digitalWrite(CAM_CS, HIGH);', '  Wire.begin();', '  SPI.begin();', '  cam.write_reg(ARDUCHIP_TEST1, 0x55);', '  say("Camera", cam.read_reg(ARDUCHIP_TEST1) == 0x55 ? 1 : 0);  // 1: the camera answers on SPI');
  if (mx) L.push('  leds.shutdown(0, false);  // wake it up', '  leds.setIntensity(0, 3);', '  leds.clearDisplay(0);');
  if (dfp != null) L.push(cyd ? '  dfSerial.begin(9600, SERIAL_8N1, DF_RX, DF_TX);' : '  dfSerial.begin(9600);', '  playerOk = player.begin(dfSerial);', '  if (playerOk) player.volume(20);  // 0 to 30', '  say("DFPlayer", playerOk ? 1 : 0);  // 0: check TX, RX and the SD card');
  if (sdc != null) L.push('  sdOk = SD.begin(SD_CS);', '  say("SD", sdOk ? 1 : 0);  // 0: check the wires and that the card is FAT32');
  if (cam && (drv === 'ssd1306' || lcd || tofs.length)) L.push('  Wire.begin(15, 14);  // ESP32-CAM: SDA 15, SCL 14');
  if (drv === 'ssd1306' && !cyd) L.push('  screen.begin(SSD1306_SWITCHCAPVCC, 0x3C);');
  else if (cyd) L.push('  screen.init();', '  screen.setRotation(1);', '  screen.fillScreen(TFT_BLACK);', '  screen.setTextColor(TFT_WHITE, TFT_BLACK);', '  screen.drawString("NOCIV", 10, 20, 4);', '  touchBus.begin(25, 39, 32, 33);', '  touch.begin(touchBus);');
  else if (screen) L.push('  screen.begin();', '  screen.fillScreen(0x0000);');
  L.push('  show(' + (mode === 'timer' ? 'clock()' : cStr({ test: 'Ready', synth: 'Synth ready', macro: 'Macro pad ready', midi: 'MIDI ready', sound: 'Soundboard ready' }[mode])) + ');', mode === 'midi' && !pm ? '' : '  Serial.println("NOCIV ready");', '}', '');
  L.push('void loop() {');
  if (keys.length) L.push('  for (int i = 0; i < NBTN; i++) {  // buttons', '    bool now = digitalRead(BTN_PIN[i]);', '    if (now != btnWas[i]) { btnWas[i] = now; if (now == LOW) press(i, BTN_NAME[i]); else release(i, BTN_NAME[i]); }', '  }');
  if (steps.length) L.push('  for (int i = 0; i < NSTEP; i++) {  // Stepped Buttons: 1/4 -> 2/4 -> 3/4 -> 4/4', '    bool now = digitalRead(STEP_PIN[i]);', '    if (now != stepWas[i]) { stepWas[i] = now; if (now == LOW) { stepAt[i] = stepAt[i] % 4 + 1; dial(' + (pots.length ? 'NPOT + ' : '') + 'i, STEP_NAME[i], stepAt[i] * 25); } }', '  }');
  if (pots.length) L.push('  for (int i = 0; i < NPOT; i++) {  // knobs and sliders', '    int v = analogRead(POT_PIN[i]) * 100L / ' + (cyd ? 4095 : 1023) + ';', '    if (abs(v - potWas[i]) >= 2) { potWas[i] = v; dial(i, POT_NAME[i], v); }', '  }');
  if (encs.length) L.push('  for (int i = 0; i < NENC; i++) {  // click wheels', '    int clk = digitalRead(ENC_PIN[i][0]);', '    if (clk != encWas[i]) { encWas[i] = clk; if (clk == LOW) { int dir = digitalRead(ENC_PIN[i][1]) != clk ? 1 : -1; encPos[i] += dir; wheel(i, ENC_NAME[i], encPos[i], dir); } }', '  }');
  if (pirs.length) L.push('  for (int i = 0; i < NPIR; i++) {  // motion sensors', '    bool now = digitalRead(PIR_PIN[i]);', '    if (now != pirWas[i]) { pirWas[i] = now; say(PIR_NAME[i], now); show(String(PIR_NAME[i]) + (now ? " motion" : " still")); }', '  }');
  if (mats.length) L.push('  if (pad.getKeys()) {  // the 4x4 keypad', '    for (int i = 0; i < LIST_MAX; i++) {', '      if (!pad.key[i].stateChanged) continue;', '      String name = String("Key-") + pad.key[i].kchar;', '      if (pad.key[i].kstate == PRESSED) press(pad.key[i].kcode, name);', '      else if (pad.key[i].kstate == RELEASED) release(pad.key[i].kcode, name);', '    }', '  }');
  if (tofs.length) L.push('  if (tofOk && millis() > tofNext) {  // laser distance, 4 times a second', '    tofNext = millis() + 250;', '    VL53L0X_RangingMeasurementData_t m;', '    tof.rangingTest(&m, false);', '    if (m.RangeStatus != 4) say(TOF_NAME, m.RangeMilliMeter);  // 4 = out of range', '  }');
  if (cyd) L.push('  static bool wasTouched = false;  // the touch screen counts as one more button', '  bool t = touch.tirqTouched() && touch.touched();', '  if (t != wasTouched) { wasTouched = t; if (t) press(' + keys.length + ', "Touch"); else release(' + keys.length + ', "Touch"); }');
  if (mode === 'midi') L.push('  if (noteOn >= 0 && STEP_MODE && millis() > noteOff) { midi(0x80, noteNumber(noteOn), 0); noteOn = -1; }  // the short 1/4 note ends');
  if (mode === 'timer') L.push('  if (running && millis() - tick >= 1000) {  // one second passed', '    tick += 1000; remaining--; show(clock());', '    if (remaining <= 0) { running = false; show("00:00 done!"); for (int i = 0; i < 3; i++) { ' + beep(880, 150) + ' delay(250); } remaining = minutes * 60L; }', '  }');
  L.push('  delay(5);  // a tiny rest, also stops button bounce', '}', '');
  return { text: L.join('\n'), libs, lang: 'ino', file: 'casezero.ino' };
}
const pyStr = (s) => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
function codePy(plan, title, fn, B, tw) {
  B = B || BOARDS.pico; const PFX = B.cp || 'board.GP', LB = B.lab, SPI = B.spi || [18, 19, 16], I2C = B.i2c || [4, 5];
  if (!B.cp) return pinList(plan, title, B, fn);
   // fn: a recipe's own program (macro, timer, synth) in place of the pin test
  const keys = [], pots = [], encs = [], outs = [], pirs = [], tofs = [], cams = [], mats = [], sds = [], lcds = [], L = [];
  let mx = null, i2s = null, mic = null, dfp = null;
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
    if (N.what === 'mp3') { if (!dfp && R['tx+rx'] != null) dfp = R; return; }
    if (N.what === 'sd') { if (R.cs != null) sds.push([R.cs, tag]); return; }
    if (N.what === 'lcd') { lcds.push(tag); return; }
    if (N.spi || N.i2c) { if (!screen) screen = { N, R, label: it.label }; return; }
    if (N.what === 'button' && it.step && row.roles.length === 1 && row.roles[0].pin != null) { pots.push([row.roles[0].pin, tag, 'step']); return; } /* a Stepped Button: read like a knob, 25/50/75/100 */
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
  if (mx) libs.push('adafruit_max7219', 'adafruit_framebuf.mpy', 'adafruit_bus_device'); if (lcds.length) libs.push('lcd (from the Community Bundle)'); if (fn === 'sampler' || (fn === 'midi' && keys.length)) libs.push('adafruit_midi');
  const SC = SCALES[tw.scale] || SCALES.major, TAP = tw.btn === 'step' ? '0.25' : 'None', SCN = { major: 'Major', penta: 'Pentatonic', minor: 'Minor' }[tw.scale] || 'Major';
  const sam = fn === 'sampler' && mats.length, synth = !!i2s || (sam && has('sound')); /* synthio plays the pads: out of the I2S DAC, or one PWM pin to the jack */
  const i2cBus = !!(cams.length || tofs.length || lcds.length), misoBus = !!(cams.length || sds.length), bus = i2cBus || misoBus; /* sensors share one I2C bus (and the camera and SD card the SPI bus, with MISO) with the screen, made once at the top */
  L.push('# NOCIV Case Zero starter code. ' + title, '# Brain: ' + B.name + (B === BOARDS.pico ? ', Pico W or Pico 2 (same pins).' : '. CircuitPython names its pins board.IO and the number.'), '#',
    '# 1. Put CircuitPython 9 or newer on the Pico: circuitpython.org, search your board, follow the steps.',
    libs.length ? '# 2. From the CircuitPython Library Bundle, copy into CIRCUITPY/lib: ' + libs.join(', ') + '.' : '# 2. No extra libraries needed.',
    '# 3. Save this file as code.py on the CIRCUITPY drive. It starts by itself.', '#',
    '# Every press, turn and slide also prints a line like "NOCIV B1 1" for the live test.', '# Pins come from your Case Zero wiring map. Change them there and save this file again.', '',
    'import time', 'import board');
  if (keys.length || mats.length) L.push('import keypad');
  if (pots.some((p) => p[2] !== 'step')) L.push('import analogio');
  if (encs.length) L.push('import rotaryio');
  const inputs = keys.length || pots.length || encs.length || pirs.length || mats.length;
  if (has('led') || inputs || cams.length) L.push('import digitalio');
  if (bus || dfp) L.push('import busio');
  if (sds.length) L.push('import sdcardio', 'import storage');
  if ((has('sound') && !sam) || has('servo')) L.push('import pwmio');
  if (synth) L.push('import synthio', i2s ? 'import audiobusio' : 'import audiopwmio');
  if (mx) L.push('import bitbangio', 'from adafruit_max7219 import matrices');
  if (has('ring')) L.push('import neopixel');
  if (has('servo')) L.push('from adafruit_motor import servo');
  L.push('');
  L.push('status = None', '');
  if (bus) { L.push('# ---- the shared wires: ' + [i2cBus ? 'I2C on ' + LB(I2C[0]) + ' (SDA) and ' + LB(I2C[1]) + ' (SCL)' : '', misoBus ? 'SPI on ' + SPI.map(LB).join(', ') + ' (SCK, MOSI, MISO)' : ''].filter(Boolean).join(', ') + ' ----');
    if (i2cBus) L.push('try:', '    i2c = busio.I2C(' + PFX + I2C[1] + ', ' + PFX + I2C[0] + ')', 'except Exception as err:', '    i2c = None', '    print("NOCIV I2C not found yet:", err)');
    if (misoBus) L.push('spi = busio.SPI(' + PFX + SPI[0] + ', MOSI=' + PFX + SPI[1] + ', MISO=' + PFX + SPI[2] + ')');
    L.push(''); }
  if (screen) {
    const S2 = screen.N, R = screen.R, big = S2.w >= 240, at = L.length;
    L.push('# ---- screen: ' + screen.label + ' ----', 'import busio', 'import displayio', 'import terminalio', 'from adafruit_display_text import label', 'displayio.release_displays()');
    if (S2.spi) {
      L.push('try:', '    from fourwire import FourWire', 'except ImportError:', '    from displayio import FourWire');
      if (!misoBus) L.push('spi = busio.SPI(' + PFX + SPI[0] + ', MOSI=' + PFX + SPI[1] + ')');
      L.push('bus = FourWire(spi, command=' + PFX + R.dc + ', chip_select=' + PFX + R.cs + ', reset=' + PFX + R.rst + ', baudrate=24000000)');
      if (S2.driver === 'ili9341') L.push('import adafruit_ili9341', 'display = adafruit_ili9341.ILI9341(bus, width=320, height=240)');
      else L.push('import gc9a01', 'display = gc9a01.GC9A01(bus, width=240, height=240)');
    } else {
      L.push('try:', '    from i2cdisplaybus import I2CDisplayBus', 'except ImportError:', '    from displayio import I2CDisplay as I2CDisplayBus');
      L.push('import adafruit_displayio_ssd1306'); if (!i2cBus) L.push('i2c = busio.I2C(' + PFX + I2C[1] + ', ' + PFX + I2C[0] + ')'); L.push('bus = I2CDisplayBus(i2c, device_address=0x3C)', 'display = adafruit_displayio_ssd1306.SSD1306(bus, width=128, height=64)');
    }
    L.push('group = displayio.Group()', 'display.root_group = group',
      'title = label.Label(terminalio.FONT, text="NOCIV", scale=' + (big ? 3 : 2) + ', x=' + (S2.driver === 'gc9a01' ? 70 : 8) + ', y=' + (big ? 40 : 12) + ')',
      'status = label.Label(terminalio.FONT, text="Press a button", scale=' + (big ? 2 : 1) + ', x=' + (S2.driver === 'gc9a01' ? 40 : 8) + ', y=' + (big ? 110 : 44) + ')',
      'group.append(title)', 'group.append(status)');
    // everything about the screen sits inside one try: with no screen connected yet, the rest still runs and can be tested
    const body = L.splice(at + 1).map((x) => '    ' + x); L.push('try:'); body.forEach((x) => L.push(x)); L.push('except Exception as err:', '    status = None', '    print("NOCIV screen not found yet:", err)', '');
  }
  if (lcds.length) L.push('# ---- ' + lcds[0] + ' 1602 LCD: I2C backpack at 0x27 (some are 0x3F), VCC to ' + B.v5 + ' ----', 'lcd = None', 'try:', '    from lcd.lcd import LCD', '    from lcd.i2c_pcf8574_interface import I2CPCF8574Interface', '    lcd = LCD(I2CPCF8574Interface(i2c, 0x27), num_rows=2, num_cols=16)', '    lcd.print("NOCIV")', 'except Exception as err:', '    print("NOCIV LCD not found yet:", err)', '');
  if (sds.length) L.push('# ---- ' + sds[0][1] + ' microSD reader: CS ' + LB(sds[0][0]) + ', on the shared SPI. Sound clips go on the card, the code sees them in /sd ----', 'try:', '    sd = sdcardio.SDCard(spi, ' + PFX + sds[0][0] + ')', '    storage.mount(storage.VfsFat(sd), "/sd")', '    print("NOCIV SD 1")', 'except Exception as err:', '    print("NOCIV SD not found yet:", err)', '');
  if (dfp) L.push('# ---- DFPlayer Mini: TX ' + LB(dfp['tx+rx']) + ' through a 1K resistor to its RX, RX ' + LB(dfp['tx+rx'] + 1) + ' from its TX. Files 0001.mp3, 0002.mp3... on its card ----', 'df = busio.UART(' + PFX + dfp['tx+rx'] + ', ' + PFX + (dfp['tx+rx'] + 1) + ', baudrate=9600)', '',
    'def df_cmd(cmd, arg=0):', '    # one DFPlayer command: 7E FF 06 cmd 00 high low checksum EF', '    hi, lo = arg >> 8, arg & 0xFF', '    total = -(0xFF + 0x06 + cmd + hi + lo) & 0xFFFF', '    df.write(bytes([0x7E, 0xFF, 0x06, cmd, 0x00, hi, lo, total >> 8, total & 0xFF, 0xEF]))', '',
    'time.sleep(1)  # the DFPlayer needs a moment after power on', 'df_cmd(0x06, 20)  # volume, 0 to 30', '');
  L.push('def show(text):', '    if status:', '        status.text = text');
  if (lcds.length) L.push('    if lcd:', '        lcd.clear()', '        lcd.print(text[:16])');
  L.push('');
  if (keys.length) L.push('# ---- buttons (pressed = pin to GND, the Pico pulls it up inside) ----', 'KEYS = (' + keys.map((k) => '' + PFX + k[0]).join(', ') + ',)', 'NAMES = (' + keys.map((k) => pyStr(k[1])).join(', ') + ',)', 'keys = keypad.Keys(KEYS, value_when_pressed=False, pull=True)', '');
  if (pots.some((p) => p[2] === 'step')) L.push('# ---- Stepped Button: each press steps 1/4 -> 2/4 -> 3/4 -> 4/4 (25% -> 50% -> 75% -> 100%), read like a knob ----', 'class Stepper:', '    def __init__(self, pin):', '        self.io = digitalio.DigitalInOut(pin)', '        self.io.switch_to_input(pull=digitalio.Pull.UP)', '        self.level = 0', '        self.was = True', '', '    @property', '    def value(self):', '        now = self.io.value', '        if self.was and not now:', '            self.level = self.level % 4 + 1', '            print("NOCIV step", self.level, "/ 4")', '        self.was = now', '        return self.level * 65535 // 4', '');
  if (pots.length) L.push('# ---- knobs, sliders and sticks (0 to 100) ----', 'POTS = (' + pots.map((p) => '(' + (p[2] === 'step' ? 'Stepper(' : 'analogio.AnalogIn(') + PFX + p[0] + '), ' + pyStr(p[1]) + ')').join(', ') + ',)', 'last = [-10] * len(POTS)', '');
  if (mats.length) { const R = mats[0].R; L.push('# ---- ' + mats[0].tag + ' 4x4 keypad: 4 row wires and 4 column wires, 16 keys ----', 'PADS = keypad.KeyMatrix(row_pins=(' + [1, 2, 3, 4].map((i) => PFX + R['row' + i]).join(', ') + '), column_pins=(' + [1, 2, 3, 4].map((i) => PFX + R['col' + i]).join(', ') + '))',
    'PAD_NAMES = ' + (sam ? '("Pad 1", "Pad 2", "Pad 3", "Mode", "Pad 4", "Pad 5", "Pad 6", "Bank", "Pad 7", "Pad 8", "Pad 9", "Record", "Pad 10", "Pad 11", "Pad 12", "Stop")' : '("1", "2", "3", "A", "4", "5", "6", "B", "7", "8", "9", "C", "*", "0", "#", "D")'), ''); }
  if (mx) L.push('# ---- 8x8 LED matrix (MAX7219): DIN ' + LB(mx.din) + ', CS ' + LB(mx.cs) + ', CLK ' + LB(mx.clk) + ' ----', 'leds = None', 'try:', '    leds = matrices.Matrix8x8(bitbangio.SPI(' + PFX + mx.clk + ', MOSI=' + PFX + mx.din + '), digitalio.DigitalInOut(' + PFX + mx.cs + '))', '    leds.brightness(3)', '    leds.fill(0)', '    leds.show()', 'except Exception as err:', '    print("NOCIV LED matrix not found yet:", err)', '');
  if (synth) { const jk = outs.find((o) => o[0] === 'sound'); L.push(i2s ? '# ---- sound: the I2S DAC on BCLK ' + LB(i2s['bclk+lrc']) + ', LRC ' + LB(i2s['bclk+lrc'] + 1) + ', DIN ' + LB(i2s.din) + ' ----' : '# ---- sound: one pin (' + LB(jk[1]) + ') to the jack, mono, through the 1K resistor and 100 nF capacitor ----',
    i2s ? 'audio = audiobusio.I2SOut(bit_clock=' + PFX + i2s['bclk+lrc'] + ', word_select=' + PFX + (i2s['bclk+lrc'] + 1) + ', data=' + PFX + i2s.din + ')' : 'audio = audiopwmio.PWMAudioOut(' + PFX + jk[1] + ')', 'synth = synthio.Synthesizer(sample_rate=22050)', 'audio.play(synth)', ''); }
  if (mic) L.push('# ---- I2S mic (INMP441): SCK ' + LB(mic['sck+ws']) + ', WS ' + LB(mic['sck+ws'] + 1) + ', SD ' + LB(mic.sd) + '.', '# CircuitPython has no I2S input, so this file does not record. main.py, saved next to it from the builder, records the mic in MicroPython:', '# put MicroPython on the board instead of CircuitPython to use it.', '');
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
      'MAC = ' + (tw.mac ? 'True' : 'False') + '  # True on a Mac: Cmd instead of Ctrl', 'kbd = Keyboard(usb_hid.devices)', 'media = ConsumerControl(usb_hid.devices)', 'MOD = Keycode.GUI if MAC else Keycode.CONTROL', 'MODNAME = "Cmd" if MAC else "Ctrl"',
      'SHORTCUTS = (("C", Keycode.C, "copy"), ("V", Keycode.V, "paste"), ("Z", Keycode.Z, "undo"), ("PLAY", None, "play/pause"))', '',
      'def fire(n):', '    if n >= len(SHORTCUTS):', '        return NAMES[n]', '    letter, code, what = SHORTCUTS[n]', '    if code is None:', '        media.send(ConsumerControlCode.PLAY_PAUSE)', '        return "Play/Pause"', '    kbd.send(MOD, code)', '    return MODNAME + "+" + letter + " (" + what + ")"', '',
      'show("Macro pad ready")', 'print("NOCIV ready")', '', 'while True:', '    event = keys.events.get()', '    if event:', '        down = 1 if event.pressed else 0', '        print("NOCIV", NAMES[event.key_number].replace(" ", "-"), down)', '        if lamp:', '            lamp.value = bool(down)', '        if down:', '            shortcut = fire(event.key_number)', '            print("NOCIV sent", shortcut)', '            show(shortcut)', '    time.sleep(0.01)', '');
    return { text: L.join('\n'), libs };
  }
  if (fn === 'timer' && keys.length) {
    L.push('# ---- Desk Timer: press the button to start or pause, hold it 1 s to reset' + (encs.length ? ', turn the wheel to set the minutes' : '') + '. It beeps at 00:00 ----', 'START = ' + st, 'minutes = ' + (tw.min || 25), 'remaining = minutes * 60', 'running = False', 'tick = time.monotonic()', 'held_at = None', '',
      'def clock():', '    return "%02d:%02d" % (remaining // 60, remaining % 60)', '', 'def ring_bell():');
    if (snd) L.push('    for _ in range(3):', '        beep.frequency = 880', '        beep.duty_cycle = 2 ** 15', '        time.sleep(0.15)', '        beep.duty_cycle = 0', '        time.sleep(0.1)', ''); else L.push('    print("NOCIV beep")', '');
    L.push('show(clock())', 'print("NOCIV ready")', '', 'while True:', '    now = time.monotonic()', '    event = keys.events.get()', '    if event and event.key_number == START:', '        if event.pressed:', '            held_at = now', '        elif held_at is not None:', '            if now - held_at >= 1:', '                running = False', '                remaining = minutes * 60', '                print("NOCIV timer reset")', '            else:', '                running = not running', '                tick = now', '                print("NOCIV timer", "start" if running else "pause")', '            held_at = None', '            show(clock() if running or remaining == minutes * 60 else clock() + " paused")');
    if (encs.length) L.push('    if not running and WHEELS[0][0].position != spot[0]:', '        minutes = max(1, min(99, minutes + WHEELS[0][0].position - spot[0]))', '        spot[0] = WHEELS[0][0].position', '        remaining = minutes * 60', '        show(clock())');
    L.push('    if running and now - tick >= 1:', '        tick += 1', '        remaining -= 1', '        show(clock())', '        if remaining <= 0:', '            running = False', '            show("00:00 done!")', '            print("NOCIV timer done")', '            ring_bell()', '            remaining = minutes * 60', '    time.sleep(0.01)', '');
    return { text: L.join('\n'), libs };
  }
  if (fn === 'synth' && keys.length && snd) {
    L.push('# ---- Mini Synth: each button plays a note.' + (pots.length ? ' Knob 1 moves the pitch' + (pots.length > 1 ? ', knob 2 sets the tempo of the arpeggio while you hold a key' : '') + '.' : '') + ' ----', 'SCALE = (' + SC.map((x) => Math.round(261.63 * Math.pow(2, x / 12))).join(', ') + ')  # ' + SCN + ' scale, in Hz', 'NOTE = (' + SC.map((x) => pyStr(['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'][x % 12])).join(', ') + ')', 'TAP = ' + TAP + '  # 0.25: each press plays one short 1/4 note. None: the note plays while you hold it', 'started = 0', 'ARP = ' + (pots.length > 1 ? '(1, 1.5, 2)' : '(1,)'), 'PLAY = (' + (() => { let n = 0; return keys.map((k) => (k[2] === 'btn' ? String(n++) : 'None')).join(', '); })() + ',)  # the note each key plays: None for a wheel or stick press', 'held = None', 'step = 0', 'next_step = 0', 'transpose = 0', 'bpm = 120', '',
      'show("Synth ready")', 'print("NOCIV ready")', '', 'while True:', '    now = time.monotonic()', '    event = keys.events.get()', '    if event and PLAY[event.key_number] is None:', '        if event.pressed:', '            print("NOCIV", NAMES[event.key_number].replace(" ", "-"), 1)', '            show(NAMES[event.key_number])', '    elif event:', '        if event.pressed:', '            held = PLAY[event.key_number]', '            step = 0', '            next_step = now', '            started = now', '            if lamp:', '                lamp.value = True', '        elif PLAY[event.key_number] == held:', '            held = None', '            beep.duty_cycle = 0', '            if lamp:', '                lamp.value = False');
    if (pots.length) L.push('    transpose = POTS[0][0].value * 24 // 65535 - 12');
    if (pots.length > 1) L.push('    bpm = 60 + POTS[1][0].value * 180 // 65535');
    L.push('    if held is not None and TAP and now - started >= TAP:', '        held = None', '        beep.duty_cycle = 0');
    L.push('    if held is not None and now >= next_step:', '        f = SCALE[held % 8] * 2 ** (held // 8 + transpose / 12) * ARP[step % len(ARP)]', '        beep.frequency = max(20, int(f))', '        beep.duty_cycle = 2 ** 15', '        if step == 0:', '            print("NOCIV note", NOTE[held % 8], int(f))', '            show(NOTE[held % 8] + " " + str(int(f)) + " Hz")', '        step += 1', '        next_step = now + 60 / bpm / 2', '    time.sleep(0.005)', '');
    return { text: L.join('\n'), libs };
  }
  if (fn === 'midi' && keys.length) {
    L.push('# ---- MIDI Controller: each button sends a USB MIDI note (' + SCN + ' scale), each knob a MIDI CC (1, 2, 3...). Any music app sees it. ----', 'import usb_midi', 'import adafruit_midi', 'from adafruit_midi.note_on import NoteOn', 'from adafruit_midi.note_off import NoteOff', 'from adafruit_midi.control_change import ControlChange', '',
      'midi = adafruit_midi.MIDI(midi_out=usb_midi.ports[1], out_channel=0)', 'SCALE = (' + SC.join(', ') + ')  # steps above middle C (60)', 'TAP = ' + TAP + '  # 0.25: each press is one short 1/4 note. None: the note holds while you hold the button', 'playing = {}', '',
      'def note_of(n):', '    return 60 + SCALE[n % 8] + 12 * (n // 8)', '', 'show("MIDI ready")', 'print("NOCIV ready")', '', 'while True:', '    now = time.monotonic()', '    event = keys.events.get()', '    if event:', '        n = event.key_number', '        print("NOCIV", NAMES[n].replace(" ", "-"), 1 if event.pressed else 0)',
      '        if event.pressed:', '            midi.send(NoteOn(note_of(n), 100))', '            playing[n] = now', '            show("Note " + str(note_of(n)))', '        elif not TAP and n in playing:', '            midi.send(NoteOff(note_of(n), 0))', '            playing.pop(n)',
      '    for n in [k for k, t in playing.items() if TAP and now - t >= TAP]:', '        midi.send(NoteOff(note_of(n), 0))', '        playing.pop(n)');
    if (pots.length) L.push('    for n, (pot, name) in enumerate(POTS):', '        value = pot.value * 100 // 65535', '        if abs(value - last[n]) >= 2:', '            last[n] = value', '            midi.send(ControlChange(1 + n, value * 127 // 100))', '            print("NOCIV", name.replace(" ", "-"), value)', '            show("CC " + str(1 + n) + " " + str(value))');
    L.push('    time.sleep(0.005)', '');
    return { text: L.join('\n'), libs };
  }
  if (fn === 'sound' && keys.length && has('sound')) {
    L.push('# ---- Soundboard: each button plays its own jingle (' + SCN + ' scale) on the speaker. ----', 'SCALE = (' + SC.map((x) => Math.round(261.63 * Math.pow(2, x / 12))).join(', ') + ')  # Hz', 'TAP = ' + TAP + '  # 0.25: one short 1/4 note per press. None: the full 3-note jingle', '',
      'def play(hz, length):', '    beep.frequency = max(20, int(hz))', '    beep.duty_cycle = 2 ** 15', '    time.sleep(length)', '    beep.duty_cycle = 0', '',
      'show("Soundboard ready")', 'print("NOCIV ready")', '', 'while True:', '    event = keys.events.get()', '    if event:', '        n = event.key_number', '        print("NOCIV", NAMES[n].replace(" ", "-"), 1 if event.pressed else 0)', '        if event.pressed:', '            show("Sound " + str(n + 1))', '            if TAP:', '                play(SCALE[n % 8], TAP)', '            else:', '                for i in range(3):', '                    play(SCALE[(n + i * 2) % 8] * (2 if n + i * 2 >= 8 else 1), 0.12)', '                    time.sleep(0.02)', '    time.sleep(0.005)', '');
    return { text: L.join('\n'), libs };
  }
  if (sam) {
    const ix = (k, n) => { const i = pots.map((p, j) => (p[2] === k ? j : -1)).filter((j) => j > -1)[n || 0]; return i == null ? 'None' : String(i); };
    L.push('# ---- Voice Sampler: 12 pads play a sound and send a USB MIDI note. Mode, Bank, Record and Stop are the right column. ----', '# Wheel (or knob) 1 = Pitch (-12 to +12), wheel 2 = Effect (0 to 100, how long a sound rings), stick left-right = Scrub (MIDI CC 1), stick up-down = Level (MIDI CC 2). Every event also prints "NOCIV ..." on Serial.',
      'import array', 'import math', 'import random', 'import usb_midi', 'import adafruit_midi', 'from adafruit_midi.note_on import NoteOn', 'from adafruit_midi.note_off import NoteOff', 'from adafruit_midi.control_change import ControlChange', '',
      'midi = adafruit_midi.MIDI(midi_out=usb_midi.ports[1], out_channel=0)', 'MODES = ("Chopper", "Drum", "Ambient")', 'PAD_OF = (0, 1, 2, None, 3, 4, 5, None, 6, 7, 8, None, 9, 10, 11, None)',
      'WAVES = (', '    array.array("h", [int(30000 - i * 60000 / 256) for i in range(256)]),', '    array.array("h", [random.randint(-30000, 30000) for _ in range(256)]),', '    array.array("h", [int(30000 * math.sin(i * math.pi / 128)) for i in range(256)]),', ')',
      'PITCH, EFFECT, SCRUB, LEVEL = ' + ix('knob', 0) + ', ' + ix('knob', 1) + ', ' + ix('x', 0) + ', ' + ix('y', 0), 'PW, EW = ' + (encs.length > 0 ? '0' : 'None') + ', ' + (encs.length > 1 ? '1' : 'None') + '  # the click wheels for Pitch and Effect', 'level = 1.0', 'mode = 0', 'bank = 0', 'recording = False', 'pitch = 0', 'effect = 50', 'scrub = 50', 'voices = {}', '',
      'def note_of(n):', '    return 36 + n if mode == 1 else 48 + bank * 12 + n', '', 'def hz(n):', '    return 440 * 2 ** ((note_of(n) - 69 + pitch) / 12)', '',
      'def envelope():', '    if mode == 0:', '        return synthio.Envelope(attack_time=0.002, decay_time=0.08 + effect / 400, sustain_level=0.5, release_time=0.05)', '    if mode == 1:', '        return synthio.Envelope(attack_time=0.001, decay_time=0.04 + effect / 600, sustain_level=0.0, release_time=0.04)', '    return synthio.Envelope(attack_time=0.3, decay_time=0.4, sustain_level=0.8, release_time=0.4 + effect / 40)', '',
      'def light(n):', '    if not leds:', '        return', '    leds.fill(0)', '    if n is not None:', '        x, y = (n % 4) * 2, (n // 4) * 2', '        for dx in (0, 1):', '            for dy in (0, 1):', '                leds.pixel(x + dx, y + dy, 1)', '    for i in range(effect * 8 // 101 + 1):', '        leds.pixel(i, 7, 1)', '    leds.show()', '',
      'def knob(i):', '    if i is None:', '        return None', '    v = POTS[i][0].value * 100 // 65535', '    if abs(v - last[i]) < 2:', '        return None', '    last[i] = v', '    return v', '');
    if (!mx) L.push('leds = None', '');
    if (!synth) L.push('synth = None  # add the 3.5mm jack or the I2S DAC to hear the pads', '');
    if (!pots.length) L.push('POTS = ()', 'last = []', '');
    L.push('show("Sampler: " + MODES[mode])', 'light(None)', 'print("NOCIV ready")', '', 'while True:', '    event = PADS.events.get()', '    if event:', '        name = PAD_NAMES[event.key_number]', '        n = PAD_OF[event.key_number]', '        print("NOCIV", name.replace(" ", "-"), 1 if event.pressed else 0)', '        if lamp:', '            lamp.value = event.pressed',
      '        if n is not None and event.pressed:', '            voice = synthio.Note(hz(n), waveform=WAVES[mode], envelope=envelope(), amplitude=level)', '            voices[n] = voice', '            if synth:', '                synth.press(voice)', '            midi.send(NoteOn(note_of(n), 100))', '            light(n)', '            show(name + " " + MODES[mode])',
      '        elif n is not None:', '            voice = voices.pop(n, None)', '            if voice and synth:', '                synth.release(voice)', '            midi.send(NoteOff(note_of(n), 0))',
      '        elif event.pressed:', '            if name == "Mode":', '                mode = (mode + 1) % 3', '                show("Mode: " + MODES[mode])', '            elif name == "Bank":', '                bank = (bank + 1) % 4', '                show("Bank " + "ABCD"[bank])', '            elif name == "Record":', '                recording = not recording', '                show("REC" if recording else "Rec off")', '                print("NOCIV record", 1 if recording else 0)', '            elif name == "Stop":', '                if synth:', '                    synth.release_all()', '                voices.clear()', '                light(None)', '                show("Stop")',
      '    if PW is not None and WHEELS[PW][0].position != spot[PW]:', '        pitch = max(-12, min(12, pitch + WHEELS[PW][0].position - spot[PW]))', '        spot[PW] = WHEELS[PW][0].position', '        for n, voice in voices.items():', '            voice.frequency = hz(n)', '        midi.send(ControlChange(16, (pitch + 12) * 127 // 24))', '        print("NOCIV Pitch", pitch)', '        show("Pitch %+d" % pitch)',
      '    if EW is not None and WHEELS[EW][0].position != spot[EW]:', '        effect = max(0, min(100, effect + 5 * (WHEELS[EW][0].position - spot[EW])))', '        spot[EW] = WHEELS[EW][0].position', '        midi.send(ControlChange(74, effect * 127 // 100))', '        print("NOCIV Effect", effect)', '        show("Effect " + str(effect))', '        light(None)',
      '    v = knob(LEVEL)', '    if v is not None:', '        level = 0.2 + v * 0.8 / 100', '        for voice in voices.values():', '            voice.amplitude = level', '        midi.send(ControlChange(2, v * 127 // 100))', '        print("NOCIV Level", v)', '        show("Level " + str(v))',
      '    v = knob(PITCH)', '    if v is not None:', '        pitch = v * 24 // 100 - 12', '        for n, voice in voices.items():', '            voice.frequency = hz(n)', '        midi.send(ControlChange(16, v * 127 // 100))', '        print("NOCIV Pitch", pitch)', '        show("Pitch %+d" % pitch)',
      '    v = knob(EFFECT)', '    if v is not None:', '        effect = v', '        midi.send(ControlChange(74, v * 127 // 100))', '        print("NOCIV Effect", v)', '        show("Effect " + str(v))', '        light(None)',
      '    v = knob(SCRUB)', '    if v is not None:', '        scrub = v', '        midi.send(ControlChange(1, v * 127 // 100))', '        print("NOCIV Scrub", v)', '        show("Scrub " + str(v) + "%")', '    time.sleep(0.005)', '');
    if (B === BOARDS.pico) { const its = plan.rows.map((r) => r.it), np = planWiring(its, {}, BOARDS.nano); L.push('# ---- Arduino pin map reference: the same parts on an Arduino Nano ----'); np.rows.forEach((row) => L.push('#   ' + row.it.label + ': ' + (row.roles.length ? row.roles.map((r) => r.role + ' ' + (r.pin == null ? '?' : BOARDS.nano.lab(r.pin)) + (r.two ? ' + ' + BOARDS.nano.lab(r.pin + 1) : '')).join(', ') : 'no pin') + (row.power ? ', power ' + (row.power === 'VBUS' ? '5V' : '3V3') : ''))); np.problems.forEach((p) => L.push('#   Fix: ' + p)); L.push(''); }
    return { text: L.join('\n'), libs };
  }
  L.push('show("Ready")', 'print("NOCIV ready")', '', 'while True:');
  let body = 0;
  if (mats.length) { L.push('    event = PADS.events.get()', '    if event:', '        print("NOCIV", "Key-" + PAD_NAMES[event.key_number], 1 if event.pressed else 0)', '        if lamp:', '            lamp.value = event.pressed', '        if event.pressed:', '            show("Key " + PAD_NAMES[event.key_number])');
    if (dfp) L.push('            df_cmd(0x03, event.key_number + 1)  # key 1 plays 0001.mp3');
    if (mx) L.push('            if leds:', '                leds.fill(0)', '                leds.pixel(event.key_number % 4 * 2, event.key_number // 4 * 2, 1)', '                leds.show()');
    if (synth) L.push('            synth.press(60 + event.key_number)', '        else:', '            synth.release(60 + event.key_number)');
    body++; }
  if (keys.length) {
    L.push('    event = keys.events.get()', '    if event:', '        name = NAMES[event.key_number]', '        down = 1 if event.pressed else 0', '        print("NOCIV", name.replace(" ", "-"), down)', '        if lamp:', '            lamp.value = bool(down)', '        if down:', '            show(name + " pressed")');
    if (dfp) L.push('            df_cmd(0x03, event.key_number + 1)  # button 1 plays 0001.mp3');
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

// ---------- the mic recorder: MicroPython, because CircuitPython has no I2S input ----------
// Hold the record button (the keypad's Record key, or the first button) to record the INMP441 into rec.wav on the board. With an I2S DAC it plays the take back.
export function micMain(plan, title, B) {
  B = B || BOARDS.pico; if (!B.cp) return null; const R = (w) => { const row = plan.rows.find((r) => r.N.what === w); if (!row) return null; const o = {}; row.roles.forEach((q) => { o[q.role] = q.pin; }); return o; };
  const mic = R('i2sin'); if (!mic || mic['sck+ws'] == null || mic.sd == null) return null;
  const dac = R('i2sout'), kp = R('keypad'), btn = plan.rows.find((r) => r.N.what === 'button' && r.roles.length && r.roles[0].pin != null), LB = B.lab, sck = mic['sck+ws'];
  const L = ['# NOCIV Case Zero mic recorder (MicroPython). ' + title, '# Brain: ' + B.name + '.', '#',
    '# 1. Put MicroPython on the board (micropython.org/download, your board). It runs instead of CircuitPython.',
    '# 2. Copy this file to the board as main.py (Thonny: File, Save as, MicroPython device). It starts by itself.',
    '# 3. ' + (kp ? 'Hold the keypad\'s Record key' : btn ? 'Hold ' + btn.it.label : 'It records 5 seconds when it starts') + ': it records the mic into rec.wav on the board' + (dac ? ', then plays it back through the DAC.' : '. Open rec.wav in Thonny (View, Files) to copy it to the computer.'),
    '#', '# Mic: INMP441, SCK ' + LB(sck) + ', WS ' + LB(sck + 1) + ', SD ' + LB(mic.sd) + ', L/R to GND, VDD to 3V3.' + (dac ? ' DAC: BCLK ' + LB(dac['bclk+lrc']) + ', LRC ' + LB(dac['bclk+lrc'] + 1) + ', DIN ' + LB(dac.din) + '.' : ''), '',
    'import time', 'import struct', 'import micropython', 'from machine import I2S, Pin', '',
    'RATE = 16000', 'SECONDS = 10  # the longest take', 'GAIN = 6  # louder: 7 or 8; quieter: 4', 'FILE = "rec.wav"', '',
    'mic = I2S(0, sck=Pin(' + sck + '), ws=Pin(' + (sck + 1) + '), sd=Pin(' + mic.sd + '), mode=I2S.RX, bits=32, format=I2S.MONO, rate=RATE, ibuf=16000)',
    'raw = bytearray(4096)', 'pcm = bytearray(2048)', ''];
  if (kp) L.push('# the keypad: Record is row 3, column 4. Drive that row low, read that column.', 'row = Pin(' + kp.row3 + ', Pin.OUT, value=0)', 'col = Pin(' + kp.col4 + ', Pin.IN, Pin.PULL_UP)', 'for p in (' + [kp.row1, kp.row2, kp.row4].join(', ') + '):', '    Pin(p, Pin.IN)', '', 'def held():', '    return col.value() == 0', '');
  else if (btn) L.push('button = Pin(' + btn.roles[0].pin + ', Pin.IN, Pin.PULL_UP)', '', 'def held():', '    return button.value() == 0', '');
  else L.push('start = time.ticks_ms()', '', 'def held():', '    return time.ticks_diff(time.ticks_ms(), start) < 5000', '');
  L.push('try:', '    led = Pin("LED", Pin.OUT)', 'except (TypeError, ValueError):', '    led = None', '',
    '@micropython.native', 'def to16(src, dst, n, gain):', '    # 32 bit I2S words (24 bits of sound, left aligned) to 16 bit samples, made louder by gain bits', '    j = 0', '    for i in range(0, n, 4):', '        v = src[i + 1] | (src[i + 2] << 8) | (src[i + 3] << 16)', '        if v & 0x800000:', '            v -= 0x1000000', '        v = (v << gain) >> 8', '        if v > 32767:', '            v = 32767', '        elif v < -32768:', '            v = -32768', '        dst[j] = v & 0xFF', '        dst[j + 1] = (v >> 8) & 0xFF', '        j += 2', '    return j', '',
    'def header(f, frames):', '    size = frames * 2', '    f.write(b"RIFF" + struct.pack("<I", 36 + size) + b"WAVEfmt " + struct.pack("<IHHIIHH", 16, 1, 1, RATE, RATE * 2, 2, 16) + b"data" + struct.pack("<I", size))', '',
    'def record():', '    frames = 0', '    with open(FILE, "wb") as f:', '        header(f, 0)', '        while held() and frames < RATE * SECONDS:', '            n = mic.readinto(raw)', '            m = to16(raw, pcm, n, GAIN)', '            f.write(pcm[:m])', '            frames += m // 2', '        f.seek(0)', '        header(f, frames)', '    return frames', '');
  if (dac) L.push('def play():', '    out = I2S(1, sck=Pin(' + dac['bclk+lrc'] + '), ws=Pin(' + (dac['bclk+lrc'] + 1) + '), sd=Pin(' + dac.din + '), mode=I2S.TX, bits=16, format=I2S.MONO, rate=RATE, ibuf=8000)', '    with open(FILE, "rb") as f:', '        f.seek(44)', '        while True:', '            n = f.readinto(pcm)', '            if not n:', '                break', '            out.write(pcm[:n])', '    out.deinit()', '');
  L.push('print("NOCIV mic ready")', 'while True:', '    if held():', '        if led:', '            led.on()', '        print("NOCIV record 1")', '        frames = record()', '        if led:', '            led.off()', '        print("NOCIV record 0", frames / RATE, "s saved to", FILE)');
  if (dac) L.push('        play()', '        print("NOCIV played back")');
  if (!kp && !btn) L.push('        break');
  L.push('    time.sleep_ms(20)', '');
  return L.join('\n');
}

// ---------- power: where the battery's red (+) and black (-) wires go, at a voltage the brain can take ----------
// mode: usb (the cable powers it), aa (AA cells), lipo (3.7 V LiPo + TP4056 USB-C charger). Every red wire goes through the On/Off switch first.
export const POWER_MODES = { usb: ['USB Cable', 0], aa: ['AA Batteries', 2], lipo: ['USB-C Rechargeable LiPo', 10] };
const AA_PIN = { uno: ['aa4', 'VIN'], nano: ['aa4', 'VIN'], pico: ['aa3', 'VSYS'], esp32: ['aa3', 'VIN'], cam: ['aa3', '5V'], c3: ['aa3', '5V'], s3: ['aa3', '5V'], promicro: ['aa3', 'RAW'], cyd: ['aa3', 'VIN'] };
const LIPO_PIN = { cam: '5V', pico: 'VSYS', esp32: 'VIN', c3: '5V', s3: '5V', promicro: 'RAW', cyd: 'VIN', uno: '5V', nano: '5V' };
export function powerPlan(mode, brainType) {
  const bk = BOARD_OF[brainType] || 'pico', B = BOARDS[bk];
  if (mode === 'usb' || !POWER_MODES[mode]) return { mode: 'usb', parts: [], pin: B.v5, volts: 5, wires: [], note: 'The USB cable gives the ' + B.name + ' 5 V and its code. No battery, no switch.' };
  if (B.pi) return { mode, parts: [], pin: '5V', volts: 5, wires: [], warn: 'A Raspberry Pi needs 5 V at 2.5 A or more: AA cells and a bare LiPo cannot run it. Use a USB power bank or a Pi UPS board.' };
  if (mode === 'aa') { const [pack, pin] = AA_PIN[bk] || ['aa3', B.v5], v = pack === 'aa4' ? 6 : 4.5;
    return { mode, pack, parts: [pack, 'slidesw'], pin, volts: v, wires: [['+ red', pin, 'sw'], ['- black', 'GND']],
      note: (pack === 'aa4' ? '4xAA = 6 V' : '3xAA = 4.5 V') + ' into ' + pin + (pin === 'VSYS' ? ' (takes 1.8 to 5.5 V)' : pin === 'VIN' && v >= 6 ? ' (through the on-board regulator)' : '') + '. Never into a 3V3 pin.',
      warn: bk === 'uno' || bk === 'nano' ? 'VIN wants 7 V or more for a steady 5 V: fresh AA cells (6 V) work, tired ones brown out. A 9 V pack or 6xAA lasts longer.' : '' };
  }
  const pin = LIPO_PIN[bk] || B.v5, avr = bk === 'uno' || bk === 'nano';
  return { mode, pack: 'lipo', parts: ['lipo1200', 'tp4056', 'slidesw'], pin, volts: 3.7, wires: [['OUT+ red', pin, 'sw'], ['OUT- black', 'GND']],
    note: 'LiPo 3.7 V (4.2 V full) to B+ / B- on the TP4056. OUT+ through the switch' + (pin === 'VSYS' ? ' and a 1N5817 diode' : '') + ' to ' + pin + '. Charge through the USB-C port on the wall.',
    warn: avr ? 'An Uno or Nano needs 5 V: put a $1 MT3608 boost board (set to 5 V) between the switch and the 5V pin.' : bk === 'esp32' ? 'The DevKit regulator drops about 1 V: a full LiPo runs it, a low one browns out. A 5 V boost board fixes it.' : '' };
}
