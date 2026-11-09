// Case Zero wiring map and starter code. Brain: Raspberry Pi Pico family (Pico, Pico W, Pico 2: same pins).
// planWiring() gives every part its pins by the real rules; codeFor() writes a CircuitPython code.py from that plan.
// Every press and turn prints a line like "NOCIV B1 1" so a live test can read it later over USB.

// The Pico header, top to bottom. Left side is pins 1 to 20, right side is pins 40 to 21.
export const PICO_LEFT = ['GP0', 'GP1', 'GND', 'GP2', 'GP3', 'GP4', 'GP5', 'GND', 'GP6', 'GP7', 'GP8', 'GP9', 'GND', 'GP10', 'GP11', 'GP12', 'GP13', 'GND', 'GP14', 'GP15'];
export const PICO_RIGHT = ['VBUS', 'VSYS', 'GND', '3V3_EN', '3V3', 'ADC_VREF', 'GP28', 'AGND', 'GP27', 'GP26', 'RUN', 'GP22', 'GND', 'GP21', 'GP20', 'GP19', 'GP18', 'GND', 'GP17', 'GP16'];
const ADC = [26, 27, 28];
const ALL = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 26, 27, 28];
export const PICO_PINS = ALL;
export const PICO_BRAINS = ['pico', 'picow'];

// What each kind of part needs. d = any pin, a = an analog pin (GP26 to 28), enc = two pins next to each other,
// pwm = a pin whose PWM slice no other sound or motor uses. power: 3V3 or VBUS (5 V from USB).
export const NEED = {
  tact12: { pins: [['press', 'd']], what: 'button' }, button16: { pins: [['press', 'd']], what: 'button' },
  arcade24: { pins: [['press', 'd']], what: 'button' }, arcade30: { pins: [['press', 'd']], what: 'button' },
  dpad: { pins: [['up', 'd'], ['down', 'd'], ['left', 'd'], ['right', 'd']], what: 'button' },
  stick: { pins: [['up', 'd'], ['down', 'd'], ['left', 'd'], ['right', 'd']], what: 'button' },
  pot: { pins: [['turn', 'a']], power: '3V3', what: 'knob' }, slider: { pins: [['slide', 'a']], power: '3V3', what: 'knob' },
  encoder: { pins: [['clk+dt', 'enc'], ['press', 'd']], power: '3V3', what: 'wheel' },
  thumb: { pins: [['x', 'a'], ['y', 'a'], ['press', 'd']], power: '3V3', what: 'stick' },
  led5: { pins: [['light', 'd']], what: 'led', note: 'Put a 220 ohm resistor on the long leg.' },
  ring12: { pins: [['data', 'd']], power: 'VBUS', what: 'ring', note: 'Power from VBUS (5 V). Keep the data wire short.' },
  speaker28: { pins: [['sound', 'pwm']], what: 'sound', note: 'A bare speaker is quiet on a pin. A piezo, or a small amp board (like a PAM8302), is louder.' },
  servo: { pins: [['signal', 'pwm']], power: 'VBUS', what: 'servo', note: 'Power from VBUS (5 V), not 3V3.' },
  tft28: { spi: true, w: 320, h: 240, driver: 'ili9341', what: 'screen' },
  round128: { spi: true, w: 240, h: 240, driver: 'gc9a01', what: 'screen' },
  oled096: { i2c: true, w: 128, h: 64, driver: 'ssd1306', what: 'screen', note: 'Qwiic or STEMMA QT version: one plug, no soldering.' },
  hdmi5: { pi: true }, hdmi7: { pi: true }
};
const slice = (n) => (n >> 1) & 7;

// items: [{ key, label, type }] in number order. over: { 'key:role': pin } her own choices win.
export function planWiring(items, over) {
  const used = {}, rows = [], problems = [], pwmSlices = {};
  const take = (pin, who) => { if (used[pin] && used[pin] !== who) problems.push('GP' + pin + ' is used twice (' + used[pin] + ' and ' + who + ').'); used[pin] = who; };
  const free = (p) => used[p] == null;
  const firstFree = (list) => list.find(free);
  const spiParts = items.filter((i) => NEED[i.type] && NEED[i.type].spi), i2cParts = items.filter((i) => NEED[i.type] && NEED[i.type].i2c);
  // 1. screens first: they need fixed pins. SPI0 = GP18 clock, GP19 data. I2C0 = GP4 SDA, GP5 SCL.
  if (spiParts.length) { take(18, 'screens (clock)'); take(19, 'screens (data)'); }
  if (i2cParts.length) { take(4, 'Qwiic (SDA)'); take(5, 'Qwiic (SCL)'); }
  const spiPick = [[17, 20, 21], [22, 16, 15], [14, 13, 12]];
  spiParts.forEach((it, n) => {
    const N = NEED[it.type], p = spiPick[n] || [], roles = [['cs', p[0]], ['dc', p[1]], ['rst', p[2]]].map(([r, d]) => { const k = it.key + ':' + r, pin = over[k] != null ? over[k] : (d != null && free(d) ? d : firstFree(ALL.filter((x) => ADC.indexOf(x) < 0))); if (pin != null) take(pin, it.label); return { role: r, pin, kind: 'd', k }; });
    rows.push({ it, roles: [{ role: 'clock', pin: 18, fixed: true }, { role: 'data', pin: 19, fixed: true }].concat(roles), power: '3V3', note: 'Backlight (LED or BL) to 3V3. MISO is not needed.', N });
  });
  i2cParts.forEach((it) => rows.push({ it, roles: [{ role: 'SDA', pin: 4, fixed: true }, { role: 'SCL', pin: 5, fixed: true }], power: '3V3', note: NEED[it.type].note, N: NEED[it.type] }));
  // 2. her own pin choices are held before anything else is picked
  items.forEach((it) => { const N = NEED[it.type]; if (!N || !N.pins) return; N.pins.forEach(([r, kind]) => { const k = it.key + ':' + r; if (over[k] != null) { take(over[k], it.label); if (kind === 'enc') take(over[k] + 1, it.label); if (kind === 'pwm') pwmSlices[slice(over[k])] = it.label; } }); });
  // 3. analog, then wheels (two pins side by side), then sound and motors, then everything else
  const order = { a: 0, enc: 1, pwm: 2, d: 3 }, wants = [];
  items.forEach((it) => { const N = NEED[it.type]; if (!N) return; if (N.pi) { problems.push(it.label + ' is an HDMI screen: it needs a Raspberry Pi brain, not a Pico.'); return; } if (!N.pins) return; N.pins.forEach(([r, kind]) => wants.push({ it, r, kind })); });
  const got = {};
  wants.slice().sort((a, b) => order[a.kind] - order[b.kind]).forEach(({ it, r, kind }) => {
    const k = it.key + ':' + r; if (over[k] != null) { got[k] = over[k]; return; }
    let pin = null;
    if (kind === 'a') { pin = firstFree(ADC); if (pin == null) problems.push(it.label + ' needs an analog pin, and the Pico has only 3 (GP26, GP27, GP28).'); }
    else if (kind === 'enc') { pin = ALL.find((p) => p + 1 <= 22 && ADC.indexOf(p) < 0 && free(p) && free(p + 1)); if (pin != null) take(pin + 1, it.label); }
    else if (kind === 'pwm') { pin = ALL.find((p) => ADC.indexOf(p) < 0 && free(p) && !pwmSlices[slice(p)]); if (pin != null) pwmSlices[slice(pin)] = it.label; }
    else pin = firstFree(ALL.filter((p) => ADC.indexOf(p) < 0)) != null ? firstFree(ALL.filter((p) => ADC.indexOf(p) < 0)) : firstFree(ADC);
    if (pin == null && kind !== 'a') problems.push('Out of pins for ' + it.label + '. Take a part off, or use a Qwiic button board (one plug for many buttons).');
    if (pin != null) take(pin, it.label); got[k] = pin;
  });
  items.forEach((it) => { const N = NEED[it.type]; if (!N || !N.pins) return; rows.push({ it, roles: N.pins.map(([r, kind]) => ({ role: r, pin: got[it.key + ':' + r], kind, k: it.key + ':' + r, two: kind === 'enc' })), power: N.power || null, note: N.note || '', N }); });
  rows.sort((a, b) => items.indexOf(a.it) - items.indexOf(b.it));
  return { rows, problems: Array.from(new Set(problems)), used };
}

// ---------- the starter code ----------
const pyStr = (s) => '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
export function codeFor(plan, title) {
  const keys = [], pots = [], encs = [], outs = [], L = [];
  let screen = null;
  plan.rows.forEach((row) => {
    const it = row.it, tag = it.label.split(' ')[0], N = row.N, R = {}; row.roles.forEach((r) => { R[r.role] = r.pin; });
    if (N.spi || N.i2c) { if (!screen) screen = { N, R, label: it.label }; return; }
    if (N.what === 'button') row.roles.forEach((r) => { if (r.pin != null) keys.push([r.pin, row.roles.length > 1 ? tag + ' ' + r.role : tag]); });
    if (N.what === 'knob' && R.turn != null) pots.push([R.turn, tag]);
    if (N.what === 'knob' && R.slide != null) pots.push([R.slide, tag]);
    if (N.what === 'stick') { if (R.x != null) pots.push([R.x, tag + ' x']); if (R.y != null) pots.push([R.y, tag + ' y']); if (R.press != null) keys.push([R.press, tag + ' press']); }
    if (N.what === 'wheel') { if (R['clk+dt'] != null) encs.push([R['clk+dt'], tag]); if (R.press != null) keys.push([R.press, tag + ' press']); }
    if (['led', 'ring', 'sound', 'servo'].indexOf(N.what) > -1 && row.roles[0].pin != null) outs.push([N.what, row.roles[0].pin, tag]);
  });
  const has = (w) => outs.some((o) => o[0] === w), libs = [];
  if (screen) { libs.push('adafruit_display_text'); if (screen.N.driver === 'ili9341') libs.push('adafruit_ili9341.mpy'); if (screen.N.driver === 'ssd1306') libs.push('adafruit_displayio_ssd1306.mpy'); if (screen.N.driver === 'gc9a01') libs.push('gc9a01.mpy (from the Community Bundle)'); }
  if (has('ring')) libs.push('neopixel.mpy'); if (has('servo')) libs.push('adafruit_motor');
  L.push('# NOCIV Case Zero starter code. ' + title, '# Brain: Raspberry Pi Pico, Pico W or Pico 2 (same pins).', '#',
    '# 1. Put CircuitPython 9 or newer on the Pico: circuitpython.org, search your board, follow the steps.',
    libs.length ? '# 2. From the CircuitPython Library Bundle, copy into CIRCUITPY/lib: ' + libs.join(', ') + '.' : '# 2. No extra libraries needed.',
    '# 3. Save this file as code.py on the CIRCUITPY drive. It starts by itself.', '#',
    '# Every press, turn and slide also prints a line like "NOCIV B1 1" for the live test.', '# Pins come from your Case Zero wiring map. Change them there and save this file again.', '',
    'import time', 'import board');
  if (keys.length) L.push('import keypad');
  if (pots.length) L.push('import analogio');
  if (encs.length) L.push('import rotaryio');
  if (has('led')) L.push('import digitalio');
  if (has('sound') || has('servo')) L.push('import pwmio');
  if (has('ring')) L.push('import neopixel');
  if (has('servo')) L.push('from adafruit_motor import servo');
  L.push('');
  if (screen) {
    const S2 = screen.N, R = screen.R, big = S2.w >= 240;
    L.push('# ---- screen: ' + screen.label + ' ----', 'import busio', 'import displayio', 'import terminalio', 'from adafruit_display_text import label', 'displayio.release_displays()');
    if (S2.spi) {
      L.push('try:', '    from fourwire import FourWire', 'except ImportError:', '    from displayio import FourWire');
      L.push('spi = busio.SPI(board.GP18, MOSI=board.GP19)', 'bus = FourWire(spi, command=board.GP' + R.dc + ', chip_select=board.GP' + R.cs + ', reset=board.GP' + R.rst + ', baudrate=24000000)');
      if (S2.driver === 'ili9341') L.push('import adafruit_ili9341', 'display = adafruit_ili9341.ILI9341(bus, width=320, height=240)');
      else L.push('import gc9a01', 'display = gc9a01.GC9A01(bus, width=240, height=240)');
    } else {
      L.push('try:', '    from i2cdisplaybus import I2CDisplayBus', 'except ImportError:', '    from displayio import I2CDisplay as I2CDisplayBus');
      L.push('import adafruit_displayio_ssd1306', 'i2c = busio.I2C(board.GP5, board.GP4)', 'bus = I2CDisplayBus(i2c, device_address=0x3C)', 'display = adafruit_displayio_ssd1306.SSD1306(bus, width=128, height=64)');
    }
    L.push('group = displayio.Group()', 'display.root_group = group',
      'title = label.Label(terminalio.FONT, text="NOCIV", scale=' + (big ? 3 : 2) + ', x=' + (S2.driver === 'gc9a01' ? 70 : 8) + ', y=' + (big ? 40 : 12) + ')',
      'status = label.Label(terminalio.FONT, text="Press a button", scale=' + (big ? 2 : 1) + ', x=' + (S2.driver === 'gc9a01' ? 40 : 8) + ', y=' + (big ? 110 : 44) + ')',
      'group.append(title)', 'group.append(status)', '', 'def show(text):', '    status.text = text', '');
  } else L.push('def show(text):', '    pass', '');
  if (keys.length) L.push('# ---- buttons (pressed = pin to GND, the Pico pulls it up inside) ----', 'KEYS = (' + keys.map((k) => 'board.GP' + k[0]).join(', ') + ',)', 'NAMES = (' + keys.map((k) => pyStr(k[1])).join(', ') + ',)', 'keys = keypad.Keys(KEYS, value_when_pressed=False, pull=True)', '');
  if (pots.length) L.push('# ---- knobs, sliders and sticks (0 to 100) ----', 'POTS = (' + pots.map((p) => '(analogio.AnalogIn(board.GP' + p[0] + '), ' + pyStr(p[1]) + ')').join(', ') + ',)', 'last = [-10] * len(POTS)', '');
  if (encs.length) L.push('# ---- click wheels (the two pins sit side by side) ----', 'WHEELS = (' + encs.map((e) => '(rotaryio.IncrementalEncoder(board.GP' + e[0] + ', board.GP' + (e[0] + 1) + '), ' + pyStr(e[1]) + ')').join(', ') + ',)', 'spot = [0] * len(WHEELS)', '');
  outs.forEach(([w, pin, tag]) => {
    if (w === 'led') L.push('# ---- ' + tag + ' light ----', 'led = digitalio.DigitalInOut(board.GP' + pin + ')', 'led.direction = digitalio.Direction.OUTPUT', '');
    if (w === 'ring') L.push('# ---- ' + tag + ' light ring ----', 'ring = neopixel.NeoPixel(board.GP' + pin + ', 12, brightness=0.2)', '');
    if (w === 'sound') L.push('# ---- ' + tag + ' sound ----', 'beep = pwmio.PWMOut(board.GP' + pin + ', frequency=440, duty_cycle=0, variable_frequency=True)', '');
    if (w === 'servo') L.push('# ---- ' + tag + ' servo ----', 'arm = servo.Servo(pwmio.PWMOut(board.GP' + pin + ', duty_cycle=2 ** 15, frequency=50))', '');
  });
  L.push('show("Ready")', 'print("NOCIV ready")', '', 'while True:');
  let body = 0;
  if (keys.length) {
    L.push('    event = keys.events.get()', '    if event:', '        name = NAMES[event.key_number]', '        down = 1 if event.pressed else 0', '        print("NOCIV", name.replace(" ", "-"), down)', '        if down:', '            show(name + " pressed")');
    if (has('led')) L.push('            led.value = not led.value');
    if (has('ring')) L.push('            ring.fill((200, 40, 30))');
    if (has('sound')) L.push('            beep.frequency = 330 + 60 * event.key_number', '            beep.duty_cycle = 2 ** 14');
    if (has('servo') && !pots.length) L.push('            arm.angle = 90 if arm.angle is None or arm.angle < 45 else 0');
    if (has('ring') || has('sound')) { L.push('        else:'); if (has('ring')) L.push('            ring.fill((0, 0, 0))'); if (has('sound')) L.push('            beep.duty_cycle = 0'); }
    body++;
  }
  if (pots.length) {
    L.push('    for n, (pot, name) in enumerate(POTS):', '        value = pot.value * 100 // 65535', '        if abs(value - last[n]) >= 2:', '            last[n] = value', '            print("NOCIV", name.replace(" ", "-"), value)', '            show(name + " " + str(value))');
    if (has('servo')) L.push('            if n == 0:', '                arm.angle = value * 180 // 100');
    body++;
  }
  if (encs.length) { L.push('    for n, (wheel, name) in enumerate(WHEELS):', '        if wheel.position != spot[n]:', '            spot[n] = wheel.position', '            print("NOCIV", name, spot[n])', '            show(name + " " + str(spot[n]))'); body++; }
  if (!body) L.push('    pass');
  L.push('    time.sleep(0.01)', '');
  return { text: L.join('\n'), libs };
}
