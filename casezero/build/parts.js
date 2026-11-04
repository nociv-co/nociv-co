/* Case Zero parts library. Every size is in millimeters, from the maker's published spec (src).
   check: true = sizes vary by seller, measure yours (the Measure tool in Body does it with your phone).
   w,h = board or body footprint. cut = what goes through the deck: {o:'circle',d} or {o:'rect',w,h} or {o:'cross',w,t} or {o:'slot',w,h}.
   depth = how far it hangs under the deck. keep = clear room around the cut for nuts and fingers.
   link = how it connects. solder: needs soldering. pins: header pins, use jumper wires (no solder). plug: keyed plug (JST, Qwiic, Grove). */
(function () {
  var C = window.CZ = window.CZ || {};
  C.CATS = [['brain', 'Brains'], ['screen', 'Screens'], ['press', 'Buttons'], ['turn', 'Knobs + sticks'], ['out', 'Light + sound'], ['move', 'Movement'], ['mine', 'My parts']];
  C.PARTS = {
    // ---------- brains (sit inside, under the deck) ----------
    pico: { cat: 'brain', name: 'Raspberry Pi Pico', short: 'Pico', w: 51, h: 21, depth: 9, inside: true, holes: [[2, 4.8], [2, 16.2], [49, 4.8], [49, 16.2]], hole: 2.1, link: 'pins', usb: 'micro USB on a short end',
      tip: 'Buy the Pico H or WH: the pins come already soldered, so jumper wires plug right on.', price: 5, src: 'Raspberry Pi Pico datasheet: 51 x 21 mm, 2.1 mm holes', url: 'https://www.raspberrypi.com/products/raspberry-pi-pico/' },
    picow: { cat: 'brain', name: 'Raspberry Pi Pico W (Wi-Fi)', short: 'Pico W', w: 51, h: 21, depth: 9, inside: true, holes: [[2, 4.8], [2, 16.2], [49, 4.8], [49, 16.2]], hole: 2.1, link: 'pins', usb: 'micro USB on a short end',
      tip: 'Pico WH has the pins already on. Same size as the Pico.', price: 7, src: 'Raspberry Pi Pico W datasheet: same 51 x 21 mm board', url: 'https://www.raspberrypi.com/products/raspberry-pi-pico/' },
    zero2: { cat: 'brain', name: 'Raspberry Pi Zero 2 W', short: 'Pi Zero 2', w: 65, h: 30, depth: 6, inside: true, holes: [[3.5, 3.5], [61.5, 3.5], [3.5, 26.5], [61.5, 26.5]], hole: 2.75, link: 'pins', usb: 'mini HDMI + 2 micro USB on one long side',
      tip: 'Runs RetroPie like the AdventurePi. Buy the WH version for pins already on.', price: 15, src: 'Raspberry Pi Zero 2 W mechanical drawing: 65 x 30 mm, M2.5 holes 58 x 23 mm apart', url: 'https://www.raspberrypi.com/products/raspberry-pi-zero-2-w/' },
    pi5: { cat: 'brain', name: 'Raspberry Pi 4 or 5', short: 'Pi 4/5', w: 85, h: 56, depth: 18, inside: true, holes: [[3.5, 3.5], [61.5, 3.5], [3.5, 52.5], [61.5, 52.5]], hole: 2.75, link: 'pins', usb: 'USB + Ethernet on a short end, power + HDMI on a long side',
      tip: 'The full computer. Plug HATs straight onto its 40 pins, no solder.', price: 45, src: 'Raspberry Pi 4/5 mechanical drawing: 85 x 56 mm, M2.5 holes 58 x 49 mm apart', url: 'https://www.raspberrypi.com/products/' },
    cyd: { cat: 'brain', name: 'Cheap Yellow Display (ESP32 + 2.8 in touch screen)', short: 'CYD', w: 86, h: 50, depth: 12, screen: true, cut: { o: 'rect', w: 58, h: 44 }, link: 'plug', usb: 'micro USB on a short end',
      tip: 'Community favorite: brain, touch screen, SD card and speaker plug on one board. Connectors are small JST plugs, no solder.', price: 15, check: true,
      src: 'ESP32-2432S028R (Sunton). Board about 86 x 50 mm, 2.8 in screen shows 43.2 x 57.6 mm. Sellers differ, measure yours.', url: 'https://www.atomic14.com/esp32/boards/esp32-2432s028r/' },
    // ---------- screens ----------
    tft28: { cat: 'screen', name: '2.8 in screen (ILI9341, SPI)', short: '2.8 in', w: 86, h: 50, depth: 8, screen: true, cut: { o: 'rect', w: 58, h: 44 }, link: 'pins', check: true,
      tip: 'Like the TPM408-2.8 on your Pico board. 14 header pins, use female to female jumpers.', price: 12, src: 'Common 2.8 in ILI9341 module: about 86 x 50 mm board, 43.2 x 57.6 mm picture', url: '' },
    round128: { cat: 'screen', name: '1.28 in round screen (GC9A01)', short: 'Round 1.28', w: 40.4, h: 37.5, depth: 5, screen: true, cut: { o: 'circle', d: 33.4 }, link: 'plug',
      tip: 'Watch faces and eyes. Comes with a plug cable, no solder.', price: 9, src: 'Waveshare 1.28inch LCD Module: 40.4 x 37.5 mm, picture 32.4 mm round, PH2.0 plug', url: 'https://www.waveshare.com/1.28inch-lcd-module.htm' },
    oled096: { cat: 'screen', name: '0.96 in OLED (SSD1306, I2C)', short: 'OLED', w: 27.3, h: 27.8, depth: 4, screen: true, cut: { o: 'rect', w: 24, h: 13 }, link: 'plug', check: true,
      tip: 'Get the Qwiic or STEMMA QT version and it plugs in with one cable.', price: 6, src: 'Common SSD1306 0.96 in module, picture 21.7 x 10.9 mm', url: 'https://www.adafruit.com/product/326' },
    hdmi5: { cat: 'screen', name: '5 in HDMI screen 800x480', short: '5 in', w: 121, h: 90, depth: 12, screen: true, cut: { o: 'rect', w: 110, h: 66 }, link: 'plug',
      tip: 'Pi screen, plugs in with HDMI and USB. AdventurePi style.', price: 55, src: 'Waveshare 5inch HDMI LCD: 121 x 89.5 mm, picture 108 x 64.8 mm', url: 'https://www.waveshare.com/wiki/5inch_HDMI_LCD_(H)' },
    hdmi7: { cat: 'screen', name: '7 in HDMI screen 1024x600', short: '7 in', w: 165, h: 100, depth: 12, screen: true, cut: { o: 'rect', w: 156, h: 88 }, link: 'plug', check: true,
      tip: 'Big Pi screen. Needs 9 x 5 squares (165 mm wide), so it does not fit the 8 x 5 box on your Panel Layout v1.', price: 60, src: 'Common 7 in 1024x600 HDMI: about 165 x 100 mm, picture 154.2 x 85.9 mm', url: '' },
    // ---------- buttons ----------
    tact12: { up: 5, cat: 'press', name: '12 mm tactile button with cap', short: 'Tact 12', w: 12, h: 12, depth: 10, cut: { o: 'circle', d: 12.5 }, keep: 8, link: 'solder',
      tip: 'The colored caps on your Pico board. Needs a board under it. No solder: buy the ones on a little breakout with pins.', price: 0.3, check: true, src: '12 x 12 mm tactile switch, round cap about 11.5 mm', url: '' },
    button16: { up: 5, cat: 'press', name: '16 mm panel button', short: 'Btn 16', w: 18, h: 18, depth: 24.4, cut: { o: 'circle', d: 16.3 }, keep: 9.1, link: 'solder',
      tip: 'Screws into the deck with a nut. No solder: push female spade plugs onto its legs.', price: 2, src: 'Adafruit 1505: 16 mm hole, 18.06 mm max width', url: 'https://www.adafruit.com/product/1505' },
    arcade24: { up: 10, cat: 'press', name: '24 mm arcade button', short: 'Arcade 24', w: 24, h: 24, depth: 33, cut: { o: 'circle', d: 24.3 }, keep: 15, link: 'plug', check: true,
      tip: 'Arcade kits come with plug wires and a USB encoder: plug and play.', price: 1.5, src: 'Sanwa OBSF-24 style: 24 mm hole', url: '' },
    arcade30: { up: 11, cat: 'press', name: '30 mm arcade button', short: 'Arcade 30', w: 30, h: 30, depth: 38, cut: { o: 'circle', d: 30.3 }, keep: 18, link: 'plug',
      tip: 'Same plug and play kit as the 24 mm.', price: 2, src: 'Adafruit 3491: 30 mm hole, 38 mm deep', url: 'https://www.adafruit.com/product/3491' },
    dpad: { up: 8, cat: 'press', name: 'Printed D-pad on 4 tactile buttons', short: 'D-pad', w: 32, h: 32, depth: 10, cut: { o: 'cross', w: 32, t: 11 }, keep: 19, link: 'solder', printed: 'dpad',
      tip: 'We print the cross for you. It rocks on 4 tactile buttons underneath.', price: 1.2, src: 'NOCIV printed part over 4 x 6 mm tactile switches', url: '' },
    // ---------- knobs + sticks ----------
    pot: { up: 15, cat: 'turn', name: 'Turn knob (10K potentiometer)', short: 'Knob', w: 17, h: 17, depth: 18, cut: { o: 'circle', d: 7.3 }, keep: 9.5, link: 'solder', printed: 'knob',
      tip: 'We print the knob. No solder: get one already on a little board with pins.', price: 1, src: 'Adafruit 562: 7 mm hole, 6 mm shaft', url: 'https://www.adafruit.com/product/562' },
    encoder: { up: 15, cat: 'turn', name: 'Click wheel (KY-040 encoder)', short: 'Encoder', w: 32, h: 19, depth: 20, cut: { o: 'circle', d: 7.3 }, keep: 10, link: 'pins', printed: 'knob', check: true,
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
    // ---------- movement ----------
    servo: { cat: 'move', name: 'Mini servo (SG90)', short: 'Servo', w: 23, h: 12.2, depth: 29, cut: { o: 'rect', w: 23.5, h: 12.7 }, keep: 8, link: 'plug', check: true,
      tip: 'Moves an arm, head or eyes. 3 wire plug. Pair it with the Cartoon maker to plan the moves.', price: 2, src: 'SG90: about 23 x 12.2 x 29 mm', url: '' }
  };
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
    ['face', 'Character', 'Round face, eyes, can move', 'slate']
  ];
  C.PRINTERS = [
    ['a1mini', 'Bambu A1 mini', 180, 180], ['a1', 'Bambu A1 / P1S / X1', 256, 256], ['mk4', 'Prusa MK4', 250, 210], ['mini', 'Prusa MINI', 180, 180],
    ['ender3', 'Ender 3 (V2, S1)', 220, 220], ['k1', 'Creality K1', 220, 220], ['k1max', 'Creality K1 Max', 300, 300], ['neptune', 'Elegoo Neptune 4', 225, 225], ['custom', 'Mine is different', 200, 200]
  ];
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
