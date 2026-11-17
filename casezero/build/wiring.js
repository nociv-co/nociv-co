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
  hdmi5: { pi: true }, hdmi7: { pi: true },
  pir: { pins: [['out', 'd']], power: 'VBUS', what: 'motion', note: 'Power it from VBUS (5 V). Its OUT pin gives 3.3 V, safe for the Pico. The two small screws set the range and how long it stays on.' },
  vl53: { i2c: true, what: 'distance', note: 'Shares the two I2C wires with any other I2C part. Most VL53L0X boards take 3V3.' },
  arducam: { cam: true, what: 'camera', note: 'SPI carries the picture (MISO on GP16), I2C sets the camera up. VCC to 3V3.' }
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
  const camParts = items.filter((i) => NEED[i.type] && NEED[i.type].cam);
  if (spiParts.length || camParts.length) { take(18, 'SPI (clock)'); take(19, 'SPI (data)'); }
  if (i2cParts.length || camParts.length) { take(4, 'I2C (SDA)'); take(5, 'I2C (SCL)'); }
  if (camParts.length) take(16, 'SPI (camera MISO)');
  camParts.forEach((it) => { const k = it.key + ':cs', pin = over[k] != null ? over[k] : [17, 20, 21, 22].find(free) != null ? [17, 20, 21, 22].find(free) : firstFree(ALL.filter((x) => ADC.indexOf(x) < 0)); if (pin != null) take(pin, it.label);
    rows.push({ it, roles: [{ role: 'clock', pin: 18, fixed: true }, { role: 'data', pin: 19, fixed: true }, { role: 'miso', pin: 16, fixed: true }, { role: 'cs', pin, kind: 'd', k }, { role: 'SDA', pin: 4, fixed: true }, { role: 'SCL', pin: 5, fixed: true }], power: '3V3', note: NEED[it.type].note, N: NEED[it.type] }); });
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
export function codeFor(plan, title, fn) { // fn: a recipe's own program (macro, timer, synth) in place of the pin test
  const keys = [], pots = [], encs = [], outs = [], pirs = [], tofs = [], cams = [], L = [];
  let screen = null;
  plan.rows.forEach((row) => {
    const it = row.it, tag = it.label.split(' ')[0], N = row.N, R = {}; row.roles.forEach((r) => { R[r.role] = r.pin; });
    if (N.what === 'motion' && R.out != null) { pirs.push([R.out, tag]); return; }
    if (N.what === 'distance') { tofs.push(tag); return; }
    if (N.what === 'camera') { cams.push([R.cs, tag]); return; }
    if (N.spi || N.i2c) { if (!screen) screen = { N, R, label: it.label }; return; }
    if (N.what === 'button') row.roles.forEach((r) => { if (r.pin != null) keys.push([r.pin, row.roles.length > 1 ? tag + ' ' + r.role : tag, 'btn']); });
    if (N.what === 'knob' && R.turn != null) pots.push([R.turn, tag]);
    if (N.what === 'knob' && R.slide != null) pots.push([R.slide, tag]);
    if (N.what === 'stick') { if (R.x != null) pots.push([R.x, tag + ' x']); if (R.y != null) pots.push([R.y, tag + ' y']); if (R.press != null) keys.push([R.press, tag + ' press']); }
    if (N.what === 'wheel') { if (R['clk+dt'] != null) encs.push([R['clk+dt'], tag]); if (R.press != null) keys.push([R.press, tag + ' press']); }
    if (['led', 'ring', 'sound', 'servo'].indexOf(N.what) > -1 && row.roles[0].pin != null) outs.push([N.what, row.roles[0].pin, tag]);
  });
  const has = (w) => outs.some((o) => o[0] === w), libs = [];
  if (screen) { libs.push('adafruit_display_text'); if (screen.N.driver === 'ili9341') libs.push('adafruit_ili9341.mpy'); if (screen.N.driver === 'ssd1306') libs.push('adafruit_displayio_ssd1306.mpy'); if (screen.N.driver === 'gc9a01') libs.push('gc9a01.mpy (from the Community Bundle)'); }
  if (has('ring')) libs.push('neopixel.mpy'); if (has('servo')) libs.push('adafruit_motor'); if (tofs.length) libs.push('adafruit_vl53l0x.mpy'); if (fn === 'macro' && keys.length) libs.push('adafruit_hid');
  const bus = !!(cams.length || tofs.length); /* sensors share one I2C bus (and the camera the SPI bus) with the screen, made once at the top */
  L.push('# NOCIV Case Zero starter code. ' + title, '# Brain: Raspberry Pi Pico, Pico W or Pico 2 (same pins).', '#',
    '# 1. Put CircuitPython 9 or newer on the Pico: circuitpython.org, search your board, follow the steps.',
    libs.length ? '# 2. From the CircuitPython Library Bundle, copy into CIRCUITPY/lib: ' + libs.join(', ') + '.' : '# 2. No extra libraries needed.',
    '# 3. Save this file as code.py on the CIRCUITPY drive. It starts by itself.', '#',
    '# Every press, turn and slide also prints a line like "NOCIV B1 1" for the live test.', '# Pins come from your Case Zero wiring map. Change them there and save this file again.', '',
    'import time', 'import board');
  if (keys.length) L.push('import keypad');
  if (pots.length) L.push('import analogio');
  if (encs.length) L.push('import rotaryio');
  const inputs = keys.length || pots.length || encs.length || pirs.length;
  if (has('led') || inputs || cams.length) L.push('import digitalio');
  if (bus) L.push('import busio');
  if (has('sound') || has('servo')) L.push('import pwmio');
  if (has('ring')) L.push('import neopixel');
  if (has('servo')) L.push('from adafruit_motor import servo');
  L.push('');
  L.push('status = None', '');
  if (bus) { L.push('# ---- the shared wires: I2C on GP4 (SDA) and GP5 (SCL)' + (cams.length ? ', SPI on GP18, GP19 and GP16' : '') + ' ----', 'try:', '    i2c = busio.I2C(board.GP5, board.GP4)', 'except Exception as err:', '    i2c = None', '    print("NOCIV I2C not found yet:", err)');
    if (cams.length) L.push('spi = busio.SPI(board.GP18, MOSI=board.GP19, MISO=board.GP16)');
    L.push(''); }
  if (screen) {
    const S2 = screen.N, R = screen.R, big = S2.w >= 240, at = L.length;
    L.push('# ---- screen: ' + screen.label + ' ----', 'import busio', 'import displayio', 'import terminalio', 'from adafruit_display_text import label', 'displayio.release_displays()');
    if (S2.spi) {
      L.push('try:', '    from fourwire import FourWire', 'except ImportError:', '    from displayio import FourWire');
      if (!cams.length) L.push('spi = busio.SPI(board.GP18, MOSI=board.GP19)');
      L.push('bus = FourWire(spi, command=board.GP' + R.dc + ', chip_select=board.GP' + R.cs + ', reset=board.GP' + R.rst + ', baudrate=24000000)');
      if (S2.driver === 'ili9341') L.push('import adafruit_ili9341', 'display = adafruit_ili9341.ILI9341(bus, width=320, height=240)');
      else L.push('import gc9a01', 'display = gc9a01.GC9A01(bus, width=240, height=240)');
    } else {
      L.push('try:', '    from i2cdisplaybus import I2CDisplayBus', 'except ImportError:', '    from displayio import I2CDisplay as I2CDisplayBus');
      L.push('import adafruit_displayio_ssd1306'); if (!bus) L.push('i2c = busio.I2C(board.GP5, board.GP4)'); L.push('bus = I2CDisplayBus(i2c, device_address=0x3C)', 'display = adafruit_displayio_ssd1306.SSD1306(bus, width=128, height=64)');
    }
    L.push('group = displayio.Group()', 'display.root_group = group',
      'title = label.Label(terminalio.FONT, text="NOCIV", scale=' + (big ? 3 : 2) + ', x=' + (S2.driver === 'gc9a01' ? 70 : 8) + ', y=' + (big ? 40 : 12) + ')',
      'status = label.Label(terminalio.FONT, text="Press a button", scale=' + (big ? 2 : 1) + ', x=' + (S2.driver === 'gc9a01' ? 40 : 8) + ', y=' + (big ? 110 : 44) + ')',
      'group.append(title)', 'group.append(status)');
    // everything about the screen sits inside one try: with no screen connected yet, the rest still runs and can be tested
    const body = L.splice(at + 1).map((x) => '    ' + x); L.push('try:'); body.forEach((x) => L.push(x)); L.push('except Exception as err:', '    status = None', '    print("NOCIV screen not found yet:", err)', '');
  }
  L.push('def show(text):', '    if status:', '        status.text = text', '');
  if (keys.length) L.push('# ---- buttons (pressed = pin to GND, the Pico pulls it up inside) ----', 'KEYS = (' + keys.map((k) => 'board.GP' + k[0]).join(', ') + ',)', 'NAMES = (' + keys.map((k) => pyStr(k[1])).join(', ') + ',)', 'keys = keypad.Keys(KEYS, value_when_pressed=False, pull=True)', '');
  if (pots.length) L.push('# ---- knobs, sliders and sticks (0 to 100) ----', 'POTS = (' + pots.map((p) => '(analogio.AnalogIn(board.GP' + p[0] + '), ' + pyStr(p[1]) + ')').join(', ') + ',)', 'last = [-10] * len(POTS)', '');
  if (encs.length) L.push('# ---- click wheels (the two pins sit side by side) ----', 'WHEELS = (' + encs.map((e) => '(rotaryio.IncrementalEncoder(board.GP' + e[0] + ', board.GP' + (e[0] + 1) + '), ' + pyStr(e[1]) + ')').join(', ') + ',)', 'spot = [0] * len(WHEELS)', '');
  outs.forEach(([w, pin, tag]) => {
    if (w === 'led') L.push('# ---- ' + tag + ' light ----', 'led = digitalio.DigitalInOut(board.GP' + pin + ')', 'led.direction = digitalio.Direction.OUTPUT', '');
    if (w === 'ring') L.push('# ---- ' + tag + ' light ring ----', 'ring = neopixel.NeoPixel(board.GP' + pin + ', 12, brightness=0.2)', '');
    if (w === 'sound') L.push('# ---- ' + tag + ' sound ----', 'beep = pwmio.PWMOut(board.GP' + pin + ', frequency=440, duty_cycle=0, variable_frequency=True)', '');
    if (w === 'servo') L.push('# ---- ' + tag + ' servo ----', 'arm = servo.Servo(pwmio.PWMOut(board.GP' + pin + ', duty_cycle=2 ** 15, frequency=50))', '');
  });
  if (pirs.length) L.push('# ---- motion sensors: OUT goes high while something moves ----', 'PIRS = []', 'for gp, name in (' + pirs.map((q) => '(board.GP' + q[0] + ', ' + pyStr(q[1]) + ')').join(', ') + ',):', '    pin = digitalio.DigitalInOut(gp)', '    pin.direction = digitalio.Direction.INPUT', '    PIRS.append([pin, name, False])', '');
  if (tofs.length) L.push('# ---- laser distance (VL53L0X), in mm. Several on one bus need their address changed: one works as it comes ----', 'tof = None', 'try:', '    import adafruit_vl53l0x', '    tof = adafruit_vl53l0x.VL53L0X(i2c)', 'except Exception as err:', '    print("NOCIV distance sensor not found yet:", err)', 'tof_name = ' + pyStr(tofs[0]), 'tof_next = 0', '');
  if (cams.length) L.push('# ---- SPI camera (Arducam Mini 2MP): this checks it answers on both buses.', '# To take photos, add Arducam\'s CircuitPython code for the Pico (their PICO_SPI_CAM examples) and use the same pins.', 'cam_cs = digitalio.DigitalInOut(board.GP' + cams[0][0] + ')', 'cam_cs.direction = digitalio.Direction.OUTPUT', 'cam_cs.value = True',
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
  L.push('show("Ready")', 'print("NOCIV ready")', '', 'while True:');
  let body = 0;
  if (keys.length) {
    L.push('    event = keys.events.get()', '    if event:', '        name = NAMES[event.key_number]', '        down = 1 if event.pressed else 0', '        print("NOCIV", name.replace(" ", "-"), down)', '        if lamp:', '            lamp.value = bool(down)', '        if down:', '            show(name + " pressed")');
    if (has('led')) L.push('            led.value = not led.value');
    if (has('ring')) L.push('            ring.fill((200, 40, 30))');
    if (has('sound')) L.push('            beep.frequency = 330 + 60 * event.key_number', '            beep.duty_cycle = 2 ** 14');
    if (has('servo') && !pots.length) L.push('            arm.angle = 90 if arm.angle is None or arm.angle < 45 else 0');
    if (has('ring') || has('sound')) { L.push('        else:'); if (has('ring')) L.push('            ring.fill((0, 0, 0))'); if (has('sound')) L.push('            beep.duty_cycle = 0'); }
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
