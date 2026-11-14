/* Case Zero parts library. Every size is in millimeters, from the maker's published spec (src).
   check: true = sizes vary by seller, measure yours (the Measure tool in Body does it with your phone).
   w,h = board or body footprint. cut = what goes through the deck: {o:'circle',d} or {o:'rect',w,h} or {o:'cross',w,t} or {o:'slot',w,h}.
   depth = how far it hangs under the deck. keep = clear room around the cut for nuts and fingers.
   link = how it connects. solder: needs soldering. pins: header pins, use jumper wires (no solder). plug: keyed plug (JST, Qwiic, Grove). */
(function () {
  var C = window.CZ = window.CZ || {};
  C.CATS = [['brain', 'Brains'], ['screen', 'Screens'], ['press', 'Buttons'], ['turn', 'Knobs + sticks'], ['out', 'Light + sound'], ['move', 'Movement'], ['power', 'Power'], ['mine', 'My parts']];
  C.PARTS = {
    // ---------- brains (sit inside, under the deck) ----------
    pico: { cat: 'brain', name: 'Raspberry Pi Pico', short: 'Pico', w: 51, h: 21, depth: 9, inside: true, holes: [[2, 4.8], [2, 16.2], [49, 4.8], [49, 16.2]], hole: 2.1, link: 'pins', usb: 'micro USB on a short end',
      tip: 'Buy the Pico H or WH: the pins come already soldered, so jumper wires plug right on.', price: 5, src: 'Raspberry Pi Pico datasheet: 51 x 21 mm, 2.1 mm holes', url: 'https://www.raspberrypi.com/products/raspberry-pi-pico/' },
    picow: { cat: 'brain', name: 'Raspberry Pi Pico W (Wi-Fi)', short: 'Pico W', w: 51, h: 21, depth: 9, inside: true, holes: [[2, 4.8], [2, 16.2], [49, 4.8], [49, 16.2]], hole: 2.1, link: 'pins', usb: 'micro USB on a short end',
      tip: 'Pico WH has the pins already on. Same size as the Pico.', price: 7, src: 'Raspberry Pi Pico W datasheet: same 51 x 21 mm board', url: 'https://www.raspberrypi.com/products/raspberry-pi-pico/' },
    pico2: { cat: 'brain', name: 'Raspberry Pi Pico 2', short: 'Pico 2', w: 51, h: 21, depth: 9, inside: true, holes: [[2, 4.8], [2, 16.2], [49, 4.8], [49, 16.2]], hole: 2.1, link: 'pins', usb: 'micro USB on a short end',
      tip: 'Same size and pins as the Pico, faster chip. Pico 2 H has the pins already on.', price: 5, src: 'Raspberry Pi Pico 2 datasheet: 51 x 21 mm, same holes as Pico', url: 'https://www.raspberrypi.com/products/raspberry-pi-pico-2/' },
    esp32: { cat: 'brain', name: 'ESP32 DevKit (Wi-Fi + Bluetooth)', short: 'ESP32', w: 51.5, h: 28.5, depth: 9, inside: true, holes: [], hole: 2.5, link: 'pins', usb: 'USB on a short end', check: true,
      tip: 'Wi-Fi and Bluetooth brain. Boards differ by seller, so measure yours.', price: 6, src: 'Common 30 pin ESP32 DevKit, about 51.5 x 28.5 mm. Sellers differ.', url: '' },
    zero2: { cat: 'brain', name: 'Raspberry Pi Zero 2 W', short: 'Pi Zero 2', w: 65, h: 30, depth: 6, inside: true, holes: [[3.5, 3.5], [61.5, 3.5], [3.5, 26.5], [61.5, 26.5]], hole: 2.75, link: 'pins', usb: 'mini HDMI + 2 micro USB on one long side',
      tip: 'Runs RetroPie like the AdventurePi. Buy the WH version for pins already on.', price: 15, src: 'Raspberry Pi Zero 2 W mechanical drawing: 65 x 30 mm, M2.5 holes 58 x 23 mm apart', url: 'https://www.raspberrypi.com/products/raspberry-pi-zero-2-w/' },
    pi5: { cat: 'brain', name: 'Raspberry Pi 4 or 5', short: 'Pi 4/5', w: 85, h: 56, depth: 18, inside: true, holes: [[3.5, 3.5], [61.5, 3.5], [3.5, 52.5], [61.5, 52.5]], hole: 2.75, link: 'pins', usb: 'USB + Ethernet on a short end, power + HDMI on a long side',
      tip: 'The full computer. Plug HATs straight onto its 40 pins, no solder.', price: 45, src: 'Raspberry Pi 4/5 mechanical drawing: 85 x 56 mm, M2.5 holes 58 x 49 mm apart', url: 'https://www.raspberrypi.com/products/' },
    cyd: { cat: 'brain', name: 'Cheap Yellow Display (ESP32 + 2.8 in touch screen)', short: 'CYD', w: 86, h: 50, depth: 12, screen: true, cut: { o: 'rect', w: 58, h: 44 }, link: 'plug', usb: 'micro USB on a short end',
      tip: 'Community favorite: brain, touch screen, SD card and speaker plug on one board. Connectors are small JST plugs, no solder.', price: 15, check: true,
      src: 'ESP32-2432S028R (Sunton). Board about 86 x 50 mm, 2.8 in screen shows 43.2 x 57.6 mm. Sellers differ, measure yours.', url: 'https://www.atomic14.com/esp32/boards/esp32-2432s028r/' },
    // ---------- screens ----------
    tft28: { cat: 'screen', name: '2.8 in screen (ILI9341, SPI)', short: 'Screen 2.8', w: 86, h: 50, depth: 8, screen: true, cut: { o: 'rect', w: 58, h: 44 }, link: 'pins', check: true,
      tip: 'Like the TPM408-2.8 on your Pico board. 14 header pins, use female to female jumpers.', price: 12, src: 'Common 2.8 in ILI9341 module: about 86 x 50 mm board, 43.2 x 57.6 mm picture', url: '' },
    round128: { cat: 'screen', name: '1.28 in round screen (GC9A01)', short: 'Round screen', w: 40.4, h: 37.5, depth: 5, screen: true, cut: { o: 'circle', d: 33.4 }, link: 'plug',
      tip: 'Watch faces and eyes. Comes with a plug cable, no solder.', price: 9, src: 'Waveshare 1.28inch LCD Module: 40.4 x 37.5 mm, picture 32.4 mm round, PH2.0 plug', url: 'https://www.waveshare.com/1.28inch-lcd-module.htm' },
    oled096: { cat: 'screen', name: '0.96 in OLED (SSD1306, I2C)', short: 'Small screen', w: 27.3, h: 27.8, depth: 4, screen: true, cut: { o: 'rect', w: 24, h: 13 }, link: 'plug', check: true,
      tip: 'Get the Qwiic or STEMMA QT version and it plugs in with one cable.', price: 6, src: 'Common SSD1306 0.96 in module, picture 21.7 x 10.9 mm', url: 'https://www.adafruit.com/product/326' },
    hdmi5: { cat: 'screen', name: '5 in HDMI screen 800x480', short: '5 in', w: 121, h: 90, depth: 12, screen: true, cut: { o: 'rect', w: 110, h: 66 }, link: 'plug',
      tip: 'Pi screen, plugs in with HDMI and USB. AdventurePi style.', price: 55, src: 'Waveshare 5inch HDMI LCD: 121 x 89.5 mm, picture 108 x 64.8 mm', url: 'https://www.waveshare.com/wiki/5inch_HDMI_LCD_(H)' },
    hdmi7: { cat: 'screen', name: '7 in HDMI screen 1024x600', short: '7 in', w: 165, h: 100, depth: 12, screen: true, cut: { o: 'rect', w: 156, h: 88 }, link: 'plug', check: true,
      tip: 'Big Pi screen. Needs 9 x 5 squares (165 mm wide), so it does not fit the 8 x 5 box on your Panel Layout v1.', price: 60, src: 'Common 7 in 1024x600 HDMI: about 165 x 100 mm, picture 154.2 x 85.9 mm', url: '' },
    // ---------- buttons ----------
    tact12: { up: 5, cat: 'press', name: '12 mm tactile button with cap', short: 'Small button', w: 12, h: 12, depth: 10, cut: { o: 'circle', d: 12.5 }, keep: 8, link: 'solder',
      tip: 'The colored caps on your Pico board. Needs a board under it. No solder: buy the ones on a little breakout with pins.', price: 0.3, check: true, src: '12 x 12 mm tactile switch, round cap about 11.5 mm', url: '' },
    button16: { up: 5, cat: 'press', name: '16 mm panel button', short: 'Button', w: 18, h: 18, depth: 24.4, cut: { o: 'circle', d: 16.3 }, keep: 9.1, link: 'solder',
      tip: 'Screws into the deck with a nut. No solder: push female spade plugs onto its legs.', price: 2, src: 'Adafruit 1505: 16 mm hole, 18.06 mm max width', url: 'https://www.adafruit.com/product/1505' },
    arcade24: { up: 10, cat: 'press', name: '24 mm arcade button', short: 'Arcade 24', w: 24, h: 24, depth: 33, cut: { o: 'circle', d: 24.3 }, keep: 15, link: 'plug', check: true,
      tip: 'Arcade kits come with plug wires and a USB encoder: plug and play.', price: 1.5, src: 'Sanwa OBSF-24 style: 24 mm hole', url: '' },
    arcade30: { up: 11, cat: 'press', name: '30 mm arcade button', short: 'Arcade 30', w: 30, h: 30, depth: 38, cut: { o: 'circle', d: 30.3 }, keep: 18, link: 'plug',
      tip: 'Same plug and play kit as the 24 mm.', price: 2, src: 'Adafruit 3491: 30 mm hole, 38 mm deep', url: 'https://www.adafruit.com/product/3491' },
    dpad: { up: 8, cat: 'press', name: 'Printed D-pad on 4 tactile buttons', short: 'D-pad', w: 32, h: 32, depth: 10, cut: { o: 'cross', w: 32, t: 11 }, keep: 19, link: 'solder', printed: 'dpad', find: '6x6 mm tactile switch',
      tip: 'We print the cross for you. It rocks on 4 tactile buttons underneath.', price: 1.2, src: 'NOCIV printed part over 4 x 6 mm tactile switches', url: '' },
    // ---------- knobs + sticks ----------
    pot: { up: 15, cat: 'turn', name: 'Turn knob (10K potentiometer)', short: 'Turn knob', w: 17, h: 17, depth: 18, cut: { o: 'circle', d: 7.3 }, keep: 9.5, link: 'solder', printed: 'knob',
      tip: 'We print the knob. No solder: get one already on a little board with pins.', price: 1, src: 'Adafruit 562: 7 mm hole, 6 mm shaft', url: 'https://www.adafruit.com/product/562' },
    encoder: { up: 15, cat: 'turn', name: 'Click wheel (KY-040 encoder)', short: 'Click wheel', w: 32, h: 19, depth: 20, cut: { o: 'circle', d: 7.3 }, keep: 10, link: 'pins', printed: 'knob', check: true,
      tip: 'The black one on your Pico board. Has 5 pins, use female jumpers, no solder.', price: 1.5, src: 'KY-040 module: about 32 x 19 mm board, 7 mm bushing', url: '' },
    thumb: { up: 18, cat: 'turn', name: 'Thumb stick (KY-023)', short: 'Thumb stick', w: 34, h: 26, depth: 32, cut: { o: 'circle', d: 26 }, keep: 17, link: 'pins',
      tip: 'Like a game controller stick. 5 pins, female jumpers, no solder.', price: 2, src: 'KY-023: 34 x 26 x 32 mm', url: '' },
    stick: { up: 32, cat: 'turn', name: 'Arcade joystick (Sanwa JLF style)', short: 'Arcade stick', w: 95, h: 53, depth: 37, cut: { o: 'circle', d: 24 }, keep: 30, link: 'plug', bolts: [[-41.5, -20], [41.5, -20], [-41.5, 20], [41.5, 20]],
      tip: 'Ball top stick from your arcade drawing. Twist the ball off before you close the lid. Comes with a 5 pin plug harness.', price: 30, src: 'Sanwa JLF-P1 plate 95 x 53 x 1.6 mm, about 37 mm below the plate', url: 'https://support.focusattack.com/hc/en-us/articles/360015744451-Sanwa-JLF-P1-Mounting-Plate-Measurements' },
    slider: { up: 10, cat: 'turn', name: 'Slider (60 mm travel)', short: 'Slider', w: 75, h: 9, depth: 12, cut: { o: 'slot', w: 62, h: 2.4 }, keep: 7, link: 'solder', check: true,
      tip: 'Sizes vary a lot. Measure yours.', price: 2, src: 'Common 60 mm travel slide potentiometer', url: '' },
    // ---------- light + sound ----------
    led5: { up: 6, cat: 'out', name: '5 mm LED', short: 'LED', w: 5, h: 5, depth: 12, cut: { o: 'circle', d: 5.1 }, keep: 4, link: 'pins',
      tip: 'Plug its legs into female jumpers. Add a 220 ohm resistor.', price: 0.1, src: 'Standard 5 mm LED', url: '' },
    ring12: { cat: 'out', name: 'Light ring (12 RGB LEDs)', short: 'Light ring', w: 37, h: 37, depth: 3, cut: { o: 'ring', d: 37, t: 8 }, keep: 20, link: 'pins', check: true,
      tip: 'Glows through a printed ring. 3 wires.', price: 4, src: 'NeoPixel style ring, about 37 mm across', url: 'https://www.adafruit.com/product/1643' },
    speaker28: { cat: 'out', name: 'Mini speaker 28 mm', short: 'Speaker', w: 28, h: 28, depth: 6, cut: { o: 'grille', d: 28 }, keep: 15, link: 'solder',
      tip: 'Glue it under the holes. Many come with a plug.', price: 2, src: 'Adafruit 1890: 28 mm across', url: 'https://www.adafruit.com/product/1890' },
    // ---------- power (new 11-13): run it without a cable ----------
    lipo1200: { cat: 'power', name: 'Battery, flat LiPo 1200 mAh', short: 'Battery', w: 62, h: 34, depth: 6, inside: true, holes: [], link: 'plug', check: true, mah: 1200,
      tip: 'Rechargeable, with a small JST plug. Buy one with a protection circuit. Hold it down with double sided tape, never a screw, and never bend or poke it. Red and black are swapped on some sellers: check before you plug it in.', price: 10, src: 'Adafruit 258: about 62 x 34 x 5 mm. Sellers differ, measure yours.', url: 'https://www.adafruit.com/product/258' },
    lipo500: { cat: 'power', name: 'Battery, flat LiPo 500 mAh', short: 'Small battery', w: 36, h: 29, depth: 6, inside: true, holes: [], link: 'plug', check: true, mah: 500,
      tip: 'Half the size, less than half the run time. Same care as the big one: protection circuit, tape not screws, check red and black.', price: 8, src: 'Adafruit 1578: about 36 x 29 x 4.75 mm. Sellers differ, measure yours.', url: 'https://www.adafruit.com/product/1578' },
    liposhim: { cat: 'power', name: 'Pico charger (LiPo SHIM for Pico)', short: 'Pico charger', w: 21, h: 21, depth: 7, inside: true, holes: [], link: 'solder', charger: true,
      tip: 'Solders to the back of the Pico and has a power button. The battery plugs into it and charges through the Pico USB plug, so one opening does both. It rides on the Pico: its square here saves the room and keeps it on your list.', price: 9, src: 'Pimoroni PIM557: 21 x 21 x 7 mm', url: 'https://shop.pimoroni.com/products/pico-lipo-shim' },
    tp4056: { cat: 'power', name: 'USB-C charger board (TP4056 with protection)', short: 'USB-C charger', w: 28, h: 17, depth: 5, inside: true, holes: [], link: 'solder', check: true, charger: true, usb: 'USB-C on a short end',
      tip: 'The cheapest way to charge. Battery to B+ and B-. OUT+ goes through the power switch, then through a 1N5817 diode (stripe toward the Pico) to the Pico VSYS pin. The diode matters: without it USB power can push back into the battery. It gets its own opening in the wall for the USB-C plug.', price: 1.5, src: 'Common TP4056 USB-C module with protection: about 28 x 17 mm. Sellers differ, measure yours.', url: '' },
    rocker: { cat: 'power', name: 'On/off switch (small rocker)', short: 'Power switch', w: 15, h: 10.5, depth: 14, cut: { o: 'rect', w: 13.2, h: 8.8 }, keep: 6, link: 'solder', check: true,
      tip: 'Snaps into the top. Wire it between the charger and the brain so off really is off.', price: 0.5, src: 'Common KCD11 rocker: about 13 x 8.5 mm opening. Sellers differ, measure yours.', url: '' },
    // ---------- movement ----------
    servo: { cat: 'move', name: 'Mini servo (SG90)', short: 'Servo', w: 23, h: 12.2, depth: 29, cut: { o: 'rect', w: 23.5, h: 12.7 }, keep: 8, link: 'plug', check: true,
      tip: 'Moves an arm, head or eyes. 3 wire plug. Pair it with the Cartoon maker to plan the moves.', price: 2, src: 'SG90: about 23 x 12.2 x 29 mm', url: '' }
  };
  // Recipes (new 11-13): a known device to start from. Each one loads a shape and a parts list, and credits the open project its code comes from.
  // parts: [type, how many]. tested: false until NOCIV has built it for real. Nothing here copies their code: we link to it.
  C.RECIPES = [
    { id: 'beat', name: 'Beat maker', level: 'Easy', style: 'groove', line: '8 steps, a click wheel and a small screen. Sends the beat over USB to a music app or synth.',
      parts: [['pico', 1], ['oled096', 1], ['encoder', 1], ['tact12', 8]], size: [10, 5],
      place: [['pico', 31, 76, 0], ['oled096', 82, 76, 0], ['encoder', 165, 76, 0]].concat([0, 1, 2, 3, 4, 5, 6, 7].map(function (i) { return ['tact12', 26 + i * 22.2, 32, 0]; })),
      credit: { project: 'PicoStepSeq', by: 'Tod Kurt (todbot)', url: 'https://github.com/todbot/picostepseq', license: 'GPL-3.0' },
      note: 'Their build uses step switches with a light in each one. This layout uses plain small buttons in their place.' },
    { id: 'midi', name: 'DJ pad', level: 'Easy', style: 'slate', line: '16 arcade buttons that play notes and samples in any music app over USB.',
      parts: [['pico', 1], ['oled096', 1], ['arcade24', 16]], size: [9, 7],
      place: [['pico', 20, 62, 1], ['oled096', 20, 121, 0]].concat([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(function (i) { return ['arcade24', 52 + (i % 4) * 33, 121 - Math.floor(i / 4) * 33, 0]; })),
      credit: { project: 'Pico LED Arcade Button MIDI Controller', by: 'Ruiz Brothers and Liz Clark, Adafruit', url: 'https://learn.adafruit.com/raspberry-pi-pico-led-arcade-button-midi-controller-fighter', license: 'see the guide' },
      note: 'Their build uses lit arcade buttons, a 1.5 in screen and an extra board for the lights. This layout uses plain 24 mm buttons and the small screen.' },
    { id: 'gb', name: 'Game handheld', level: 'Medium', style: 'hand', line: 'A pocket handheld that plays original Game Boy games you own.',
      parts: [['pico', 1], ['tft28', 1], ['dpad', 1], ['tact12', 4], ['speaker28', 1], ['lipo1200', 1], ['liposhim', 1]], size: [5, 8], add: 10,
      place: [['tft28', 53.7, 132, 0], ['dpad', 28, 76, 0], ['tact12', 74, 70, 0], ['tact12', 91, 82, 0], ['tact12', 38, 40, 0], ['tact12', 57, 40, 0], ['speaker28', 84, 40, 0], ['pico', 29.5, 120, 0], ['lipo1200', 53.7, 88, 0], ['liposhim', 90, 128, 0]],
      credit: { project: 'Pico-GB', by: 'YouMakeTech, built on RP2040-GB by deltabeard', url: 'https://github.com/YouMakeTech/Pico-GB', license: 'MIT' },
      note: 'Their code is written for a 2.2 in ILI9225 screen, so with the 2.8 in screen here the screen part of the code needs changing. Not every game runs, and it runs the Pico faster than normal. Bring your own game files.' },
    { id: 'desk', name: 'Offline desk assistant', level: 'Hard', style: 'face', line: 'Talk to it, it answers out loud. Nothing leaves the box.',
      parts: [['pi5', 1], ['round128', 1], ['speaker28', 1], ['button16', 1]],
      credit: { project: 'Ollama + Whisper + Piper', by: 'the Ollama, OpenAI Whisper and Piper projects', url: 'https://ollama.com', license: 'each has its own' },
      note: 'Needs a Pi 5 with 8 GB (about $100, more than the price shown here), a USB microphone and a memory card. Answers take several seconds. An old laptop or phone you already own is a cheaper brain.' }
  ];
  // Community picks (Reddit, Instructables, maker blogs): cheap and well documented.
  C.PICKS = [
    ['cyd', 'The Cheap Yellow Display', 'Brain plus touch screen on one board, around $15. Huge community.'],
    ['round128', 'Round watch screen', 'Watch faces, gauges and robot eyes.'],
    ['pico', 'Pico + 2.8 in screen', 'Your build. Cheapest way into handhelds.'],
    ['zero2', 'Pi Zero 2 W', 'Runs RetroPie for an AdventurePi style arcade.'],
    ['encoder', 'Click wheel', 'Menus and volume in one part.'],
    ['thumb', 'Thumb stick', 'Controller feel for a few dollars.']
  ];
  // Body styles. kind: clam = lid + base, slate = one tray.
  C.STYLES = [
    ['clam', 'Case Zero', 'Lid + base, like the AdventurePi', 'clam'],
    ['small', 'Small Case Zero', 'Opens like a book', 'clam'],
    ['slate', 'Slate', 'No lid, add height', 'slate'],
    ['calc', 'Calculator', 'Vintage, tall, screen on top', 'slate'],
    ['hand', 'Handheld', 'Tall, screen on top, buttons below', 'slate'],
    ['pad', 'Controller', 'Two grips', 'slate'],
    ['groove', 'Groovebox', 'Flat, rows of knobs', 'slate'],
    ['face', 'Character', 'Round face, eyes, can move', 'slate'],
    ['deck', 'Deck', 'Cyberdeck or laptop: big screen in the lid, keyboard and controls in the base. Measure your keyboard in Brain', 'clam'],
    ['panel', 'Panel', 'A flat panel for a box you already have: screen window, holes, notches for wires', 'panel']
  ];
  // Printers: [id, name, bed wide, bed deep, tall, brand, speed]. Sizes are the makers' published build volumes (checked Nov 2026).
  // speed = how fast it really lays plastic on a normal case, in cubic mm per second (outer walls slow everything down):
  // classic bed slinger about 3.5, newer budget about 6, fast CoreXY or Klipper machines about 10. Used only for the time estimate.
  C.PRINTERS = [
    ['a1mini', 'A1 mini', 180, 180, 180, 'bambu', 10], ['a1', 'A1', 256, 256, 256, 'bambu', 10], ['p1s', 'P1S / P1P', 256, 256, 256, 'bambu', 10], ['x1c', 'X1 Carbon', 256, 256, 256, 'bambu', 10], ['h2s', 'H2S', 340, 320, 340, 'bambu', 10], ['h2d', 'H2D (one nozzle)', 325, 320, 325, 'bambu', 10],
    ['ender3', 'Ender-3 / V2', 220, 220, 250, 'creality', 3.5], ['s1', 'Ender-3 S1 / S1 Pro', 220, 220, 270, 'creality', 3.5], ['s1plus', 'Ender-3 S1 Plus', 300, 300, 300, 'creality', 3.5], ['v3se', 'Ender-3 V3 SE', 220, 220, 250, 'creality', 6], ['v3ke', 'Ender-3 V3 KE', 220, 220, 240, 'creality', 8], ['v3', 'Ender-3 V3', 220, 220, 250, 'creality', 10], ['v3plus', 'Ender-3 V3 Plus', 300, 300, 330, 'creality', 10],
    ['k1', 'K1 / K1C / K1 SE', 220, 220, 250, 'creality', 10], ['k1max', 'K1 Max', 300, 300, 300, 'creality', 10], ['k2', 'K2', 260, 260, 260, 'creality', 10], ['k2plus', 'K2 Plus', 350, 350, 350, 'creality', 10],
    ['mk4', 'MK4 / MK4S', 250, 210, 220, 'prusa', 8], ['coreone', 'CORE One', 250, 220, 270, 'prusa', 10], ['mini', 'MINI', 180, 180, 180, 'prusa', 6],
    ['neptune', 'Elegoo Neptune 4 / 4 Pro', 225, 225, 265, 'other', 8], ['centauri', 'Elegoo Centauri Carbon', 256, 256, 256, 'other', 10], ['kobra3', 'Anycubic Kobra 3', 250, 250, 260, 'other', 10],
    ['custom', 'Mine is different', 200, 200, 200, 'other', 5]
  ];
  C.BRANDS = [['bambu', 'Bambu Lab'], ['creality', 'Creality'], ['prusa', 'Prusa'], ['other', 'Other']];
  // Words to look for in the QR code on a printer's sticker. Longer names first so "S1 Plus" wins over "S1".
  C.PRINTER_WORDS = [['ender3s1plus', 's1plus'], ['ender3s1pro', 's1'], ['ender3s1', 's1'], ['ender3v3plus', 'v3plus'], ['ender3v3se', 'v3se'], ['ender3v3ke', 'v3ke'], ['ender3v3', 'v3'], ['ender3v2', 'ender3'], ['ender3', 'ender3'],
    ['k2plus', 'k2plus'], ['k1max', 'k1max'], ['k1c', 'k1'], ['k1se', 'k1'], ['a1mini', 'a1mini'], ['x1carbon', 'x1c'], ['coreone', 'coreone'], ['mk4s', 'mk4'], ['neptune4', 'neptune'], ['centauricarbon', 'centauri'], ['kobra3', 'kobra3'],
    ['p1s', 'p1s'], ['p1p', 'p1s'], ['x1c', 'x1c'], ['x1e', 'x1c'], ['h2d', 'h2d'], ['h2s', 'h2s'], ['mk4', 'mk4'], ['k2', 'k2'], ['k1', 'k1'], ['a1', 'a1']];
  C.MATERIALS = [
    ['pla', 'PLA', 'Easiest. Fine indoors, softens in a hot car.', ['dovetail', 'glue', 'screws', 'magnets']],
    ['petg', 'PETG', 'Tougher, handles heat better. Strings a little.', ['dovetail', 'screws', 'magnets', 'snap']],
    ['abs', 'ABS / ASA', 'Strong and heat safe. Needs an enclosed printer.', ['screws', 'dovetail', 'snap', 'glue']],
    ['wood', 'Wood (Case Zero Base)', 'No printer. Print the 1:1 template, tape it on, cut it out.', ['screws', 'glue', 'magnets']]
  ];
  C.JOINS = {
    dovetail: ['Puzzle (dovetail)', 'Pieces lock together. Add a drop of glue so it stays.'],
    glue: ['Glue', 'Super glue (CA) for PLA. Strong and simple, but it is forever.'],
    screws: ['Screws + inserts', 'M3 screws into heat set inserts. Comes apart again and again.'],
    magnets: ['Magnets', '6 x 3 mm round magnets pressed into pockets. Snaps shut, comes apart in a second.'],
    snap: ['Snap fit', 'Printed clips. No hardware. Best in PETG, PLA can crack.']
  };
})();
