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
    pico: { cat: 'brain', tag: '$5 · CircuitPython (code.py) · Easiest code, drag & drop, can be a USB keyboard + MIDI', name: 'Raspberry Pi Pico', short: 'Pico', w: 51, h: 21, depth: 9, inside: true, holes: [[2, 4.8], [2, 16.2], [49, 4.8], [49, 16.2]], hole: 2.1, link: 'pins', usb: 'micro USB on a short end',
      tip: 'Buy the Pico H or WH: the pins come already soldered, so jumper wires plug right on.', price: 5, src: 'Raspberry Pi Pico datasheet: 51 x 21 mm, 2.1 mm holes', url: 'https://www.raspberrypi.com/products/raspberry-pi-pico/' },
    picow: { cat: 'brain', tag: '$7 · CircuitPython (code.py) · Easiest code, drag & drop, plus Wi-Fi', name: 'Raspberry Pi Pico W (Wi-Fi)', short: 'Pico W', w: 51, h: 21, depth: 9, inside: true, holes: [[2, 4.8], [2, 16.2], [49, 4.8], [49, 16.2]], hole: 2.1, link: 'pins', usb: 'micro USB on a short end',
      tip: 'Pico WH has the pins already on. Same size as the Pico.', price: 7, src: 'Raspberry Pi Pico W datasheet: same 51 x 21 mm board', url: 'https://www.raspberrypi.com/products/raspberry-pi-pico/' },
    pico2: { cat: 'brain', tag: '$5 · CircuitPython (code.py) · Easiest code, drag & drop, faster chip', name: 'Raspberry Pi Pico 2', short: 'Pico 2', w: 51, h: 21, depth: 9, inside: true, holes: [[2, 4.8], [2, 16.2], [49, 4.8], [49, 16.2]], hole: 2.1, link: 'pins', usb: 'micro USB on a short end',
      tip: 'Same size and pins as the Pico, faster chip. Pico 2 H has the pins already on.', price: 5, src: 'Raspberry Pi Pico 2 datasheet: 51 x 21 mm, same holes as Pico', url: 'https://www.raspberrypi.com/products/raspberry-pi-pico-2/' },
    uno: { cat: 'brain', tag: '$10-15 · Arduino (.ino) · Beginner kit classic, lots of pins, no USB keyboard', name: 'Elegoo / Arduino Uno (ATmega328P)', short: 'Uno', w: 68.6, h: 53.4, depth: 15, inside: true, holes: [[14, 2.5], [15.3, 50.7], [66.1, 7.6], [66.1, 35.5]], hole: 3.2, link: 'pins', usb: 'USB-B + barrel jack on a short end',
      tip: 'The board in most starter kits (Elegoo, Arduino). Female headers: jumper wires push straight in. Programmed in the Arduino IDE. 5 V pins.', price: 12, src: 'Arduino Uno R3 drawing: 68.6 x 53.4 mm, 3.2 mm holes', url: 'https://docs.arduino.cc/hardware/uno-rev3/' },
    nano: { cat: 'brain', tag: '$4 · Arduino (.ino) · A tiny Uno: same pins and code, no USB keyboard', name: 'Arduino Nano (ATmega328P)', short: 'Nano', w: 18, h: 45, depth: 8, inside: true, holes: [], link: 'pins', usb: 'USB on a short end', tip: 'The classic cheap Arduino. Programmed in the Arduino IDE (no CircuitPython). 5 V pins.', price: 4, src: 'Arduino Nano, 18 x 45 mm' },
    promicro: { cat: 'brain', tag: '$5 · Arduino (.ino) · Small, acts as a USB keyboard or MIDI: macro pads', name: 'Pro Micro (ATmega32U4)', short: 'Pro Micro', w: 18, h: 33, depth: 8, inside: true, holes: [], link: 'pins', usb: 'USB on a short end', tip: 'Tiny and acts as a USB keyboard: a favourite for macro pads. Programmed in the Arduino IDE. 5 V pins.', price: 5, src: 'SparkFun-style Pro Micro, 18 x 33 mm' },
    esp32c3: { cat: 'brain', tag: '$3 · CircuitPython (code.py) · Thumb-sized Wi-Fi + Bluetooth, 13 pins', name: 'ESP32-C3 SuperMini (Wi-Fi + Bluetooth)', short: 'C3 Mini', w: 18, h: 22.5, depth: 7, inside: true, holes: [], link: 'pins', usb: 'USB-C on a short end', tip: 'A thumb-sized Wi-Fi brain for about $3. Runs CircuitPython.', price: 3, src: 'ESP32-C3 SuperMini, 22.5 x 18 mm' },
    esp32s3: { cat: 'brain', tag: '$7 · Arduino (.ino) · Wi-Fi/BLE + AI audio/PSRAM (I2S mic + speaker)', name: 'ESP32-S3 DevKit (Wi-Fi/BLE + AI audio/PSRAM)', short: 'ESP32-S3', w: 63, h: 25.5, depth: 9, inside: true, holes: [], link: 'pins', usb: 'USB-C on a short end (two on most boards)', check: true,
      tip: 'Wi-Fi and Bluetooth LE with 8 MB PSRAM (N16R8) for voice and AI audio: an I2S mic and amp plug straight on. Buy pre-soldered headers for no-solder build.', price: 7, src: 'Espressif ESP32-S3-DevKitC-1 (N16R8), about 63 x 25.5 mm. Clones differ, measure yours.', url: 'https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32s3/esp32-s3-devkitc-1/' },
    esp32: { cat: 'brain', tag: '$5 · CircuitPython (code.py) or Arduino · Wi-Fi + Bluetooth, lots of pins', name: 'ESP32 DevKit V1 (Wi-Fi/BLE)', short: 'ESP32 V1', w: 51.5, h: 28.5, depth: 9, inside: true, holes: [], hole: 2.5, link: 'pins', usb: 'USB on a short end', check: true,
      tip: 'Wi-Fi and Bluetooth (BLE) brain, 30 pins. Boards differ by seller, so measure yours. Buy pre-soldered headers for no-solder build.', price: 5, src: 'Common 30 pin ESP32 DevKit, about 51.5 x 28.5 mm. Sellers differ.', url: '' },
    zero2: { cat: 'brain', tag: '$15 · Python on Linux · Runs RetroPie games, needs an SD card', name: 'Raspberry Pi Zero 2 W', short: 'Pi Zero 2', w: 65, h: 30, depth: 6, inside: true, holes: [[3.5, 3.5], [61.5, 3.5], [3.5, 26.5], [61.5, 26.5]], hole: 2.75, link: 'pins', usb: 'mini HDMI + 2 micro USB on one long side',
      tip: 'Runs RetroPie like the AdventurePi. Buy the WH version for pins already on.', price: 15, src: 'Raspberry Pi Zero 2 W mechanical drawing: 65 x 30 mm, M2.5 holes 58 x 23 mm apart', url: 'https://www.raspberrypi.com/products/raspberry-pi-zero-2-w/' },
    pi5: { cat: 'brain', tag: '$45 · Python on Linux · A full computer for big screens', name: 'Raspberry Pi 4 or 5', short: 'Pi 4/5', w: 85, h: 56, depth: 18, inside: true, holes: [[3.5, 3.5], [61.5, 3.5], [3.5, 52.5], [61.5, 52.5]], hole: 2.75, link: 'pins', usb: 'USB + Ethernet on a short end, power + HDMI on a long side',
      tip: 'The full computer. Plug HATs straight onto its 40 pins, no solder.', price: 45, src: 'Raspberry Pi 4/5 mechanical drawing: 85 x 56 mm, M2.5 holes 58 x 49 mm apart', url: 'https://www.raspberrypi.com/products/' },
    cyd: { cat: 'brain', tag: '$15 · Arduino (.ino) · All-in-one ESP32 + 2.8" touch screen, 3 spare pins', name: 'Cheap Yellow Display (ESP32 + 2.8 in touch screen)', short: 'CYD', w: 86, h: 50, depth: 12, screen: true, cut: { o: 'rect', w: 58, h: 44 }, link: 'plug', usb: 'micro USB on a short end',
      tip: 'Community favorite: brain, touch screen, SD card and speaker plug on one board. Connectors are small JST plugs, no solder.', price: 15, check: true,
      src: 'ESP32-2432S028R (Sunton). Board about 86 x 50 mm, 2.8 in screen shows 43.2 x 57.6 mm. Sellers differ, measure yours.', url: 'https://www.atomic14.com/esp32/boards/esp32-2432s028r/' },
    // ---------- screens ----------
    tft28: { cat: 'screen', name: '2.8 in screen (ILI9341, SPI)', short: 'Screen 2.8', w: 86, h: 50, depth: 8, screen: true, cut: { o: 'rect', w: 58, h: 44 }, link: 'pins', check: true,
      tip: 'Like the TPM408-2.8 on your Pico board. 14 header pins, use female to female jumpers.', price: 12, src: 'Common 2.8 in ILI9341 module: about 86 x 50 mm board, 43.2 x 57.6 mm picture', url: '' },
    round128: { cat: 'screen', name: '1.28 in round screen (GC9A01)', short: 'Round screen', w: 40.4, h: 37.5, depth: 5, screen: true, cut: { o: 'circle', d: 33.4 }, link: 'plug',
      tip: 'Watch faces and eyes. Comes with a plug cable, no solder.', price: 9, src: 'Waveshare 1.28inch LCD Module: 40.4 x 37.5 mm, picture 32.4 mm round, PH2.0 plug', url: 'https://www.waveshare.com/1.28inch-lcd-module.htm' },
    oled096: { cat: 'screen', name: '0.96 in OLED (SSD1306, I2C)', short: 'Small screen', w: 27.3, h: 27.8, depth: 4, screen: true, cut: { o: 'rect', w: 24, h: 13 }, link: 'plug', check: true,
      tip: 'Get the Qwiic or STEMMA QT version and it plugs in with one cable.', price: 6, src: 'Common SSD1306 0.96 in module, picture 21.7 x 10.9 mm', url: 'https://www.adafruit.com/product/326' },
    lcd1602: { cat: 'screen', name: '1602 LCD (16x2, I2C backpack)', short: '1602 LCD', w: 80, h: 36, depth: 20, screen: true, cut: { o: 'rect', w: 71.2, h: 24.2 }, link: 'pins', check: true,
      tip: 'Two lines of 16 letters. Get it with the I2C backpack already soldered on: 4 wires (GND, VCC, SDA, SCL). VCC to 5V. The blue screw on the back sets the contrast. Address 0x27 (some are 0x3F).', price: 4, src: 'Common HD44780 1602A module: 80 x 36 mm board, 71 x 24 mm bezel, PCF8574 backpack', url: '' },
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
    keypad44: { up: 5, cat: 'press', name: '4x4 Keypad (16 buttons, matrix)', short: 'Keypad', w: 70, h: 70, depth: 10, cut: { o: 'keys', n: 4, m: 4, p: 17, d: 12.5 }, keep: 35, link: 'pins', check: true,
      tip: '16 tactile buttons on one board, read as 4 rows and 4 columns: 8 wires for 16 keys. Its caps come up through 16 round holes.', price: 3, src: 'Common 4x4 tactile keypad module, 12 x 12 mm keys about 17 mm apart. Sellers differ, measure yours.', url: '' },
    dpad: { up: 8, cat: 'press', name: 'Printed D-pad on 4 tactile buttons', short: 'D-pad', w: 32, h: 32, depth: 10, cut: { o: 'cross', w: 32, t: 11 }, keep: 19, link: 'solder', printed: 'dpad', find: '6x6 mm tactile switch',
      tip: 'We print the cross for you. It rocks on 4 tactile buttons underneath.', price: 1.2, src: 'NOCIV printed part over 4 x 6 mm tactile switches', url: '' },
    // ---------- knobs + sticks ----------
    arducam: { up: 6, cat: 'sense', front: true, name: 'SPI Camera (Arducam Mini 2MP, OV2640)', short: 'SPI camera', w: 34, h: 24, depth: 10, cut: { o: 'circle', d: 14 }, link: 'pins',
      tip: 'Takes photos for the Pico over SPI; I2C sets the camera up. Comes with its wires. The lens looks out through a 14 mm hole.', price: 26, src: 'Arducam Mini 2MP Plus (B0067), board 34 x 24 mm', url: 'https://www.arducam.com/product/arducam-2mp-spi-camera-b0067-arduino/' },
    pir: { up: 12, cat: 'sense', front: true, name: 'PIR Motion sensor (HC-SR501)', short: 'Motion', w: 32, h: 24, depth: 14, cut: { o: 'circle', d: 23 }, link: 'pins',
      tip: 'Sees people move, up to about 7 m. Its white dome pokes out through a 23 mm hole. One signal wire.', price: 2, src: 'HC-SR501 module, 32 x 24 mm, 23 mm dome' },
    vl53: { cat: 'sense', front: true, name: 'Laser distance sensor (VL53L0X)', short: 'Distance', w: 25, h: 11, depth: 4, cut: { o: 'rect', w: 8, h: 5 }, link: 'pins',
      tip: 'Measures how far away something is, up to about 1.2 m, through a small 8 x 5 mm window. Two I2C wires.', price: 4, src: 'VL53L0X breakout, 25 x 11 mm' },
    esp32cam: { cat: 'mine', front: true, name: 'ESP32-CAM (AI-Thinker)', short: 'ESP32-CAM', w: 40.5, h: 27, depth: 12, up: 4, cut: { o: 'circle', d: 9 }, link: 'pins',
      tip: 'Its own brain with a camera and Wi-Fi. It has no USB plug: program it with the $2 ESP32-CAM-MB base (Shop adds it for you). Buy pre-soldered headers for no-solder build.', price: 8, src: 'AI-Thinker ESP32-CAM, 40.5 x 27 mm' },
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
    mat8: { cat: 'out', name: '8x8 LED Matrix (MAX7219)', short: 'LED matrix', w: 33, h: 33, depth: 14, cut: { o: 'rect', w: 32.6, h: 32.6 }, link: 'pins', check: true,
      tip: '64 red lights you set one by one. Three wires (DIN, CS, CLK) and 5 V. Get the small module with the chip under the matrix.', price: 3, src: 'MAX7219 8x8 module, 32 x 32 mm matrix', url: '' },
    jack35: { cat: 'out', name: '3.5mm Audio Jack (TRS)', short: 'Audio jack', w: 12, h: 6, depth: 6, inside: true, holes: [], link: 'solder', jack: true,
      tip: 'Headphones or a speaker cable plug in through a 6.2 mm round hole in the side wall. Stereo from a PCM5102 DAC, or mono from one Pico pin through a 1K resistor and a 100 nF capacitor.', price: 1, src: 'PJ-320 style 3.5 mm TRS socket breakout, about 12 x 6 mm, 6 mm barrel', url: '' },
    i2sdac: { cat: 'out', name: 'I2S Audio DAC / Amp (MAX98357A / PCM5102)', short: 'Audio DAC', w: 20, h: 18, depth: 5, inside: true, holes: [], link: 'pins', check: true,
      tip: 'Clean digital sound from the Pico: three I2S wires (BCLK, LRC, DIN). MAX98357A drives a speaker. PCM5102 has a line out for the 3.5mm jack.', price: 4, src: 'Adafruit 3006 (MAX98357A) about 19 x 18 mm; PCM5102 boards are similar. Sellers differ, measure yours.', url: 'https://www.adafruit.com/product/3006' },
    inmp441: { cat: 'sense', lid: true, name: 'I2S Mic (INMP441)', short: 'Mic', w: 14, h: 14, depth: 3, cut: { o: 'circle', d: 3 }, link: 'pins',
      tip: 'A digital microphone. It hears through a 3 mm hole in the lid: glue it with its sound hole over the hole. Three I2S wires (SCK, WS, SD) and 3V3.', price: 3, src: 'INMP441 breakout, about 14 mm round board', url: '' },
    // ---------- power (new 11-13): run it without a cable ----------
    dfplayer: { cat: 'out', name: 'DFPlayer Mini MP3 player (microSD, TX/RX)', short: 'DFPlayer', w: 21, h: 21, depth: 6, inside: true, holes: [], link: 'pins', check: true, store: true,
      tip: 'Plays MP3 or WAV files from its own microSD card and drives a small speaker (SPK1, SPK2) itself. Two signal wires: the brain TX to its RX through a 1K resistor, its TX to the brain RX. VCC to 5V. Copy the files onto its card as 0001.mp3, 0002.mp3..., in that order.', price: 2, src: 'DFRobot DFR0299 DFPlayer Mini: 20 x 20 mm board. Clones are similar, measure yours.', url: 'https://wiki.dfrobot.com/DFPlayer_Mini_SKU_DFR0299' },
    sdcard: { cat: 'out', name: 'MicroSD card reader (SPI)', short: 'MicroSD', w: 42, h: 24, depth: 5, inside: true, holes: [], link: 'pins', check: true, store: true,
      tip: 'Room for hundreds of sound clips. SPI: SCK, MOSI, MISO and CS. Get the one with a 3.3V regulator and level shifter (VCC to 5V), it works on a 5V Uno and a 3.3V Pico.', price: 2, src: 'Common Catalex style microSD module: about 42 x 24 mm. Sellers differ, measure yours.', url: '' },
    lipo1200: { cat: 'power', name: 'Battery, flat LiPo 1200 mAh', short: 'Battery', w: 62, h: 34, depth: 6, inside: true, holes: [], link: 'plug', check: true, mah: 1200,
      tip: 'Rechargeable, with a small JST plug. Buy one with a protection circuit. Hold it down with double sided tape, never a screw, and never bend or poke it. Red and black are swapped on some sellers: check before you plug it in.', price: 10, src: 'Adafruit 258: about 62 x 34 x 5 mm. Sellers differ, measure yours.', url: 'https://www.adafruit.com/product/258' },
    lipo500: { cat: 'power', name: 'Battery, flat LiPo 500 mAh', short: 'Small battery', w: 36, h: 29, depth: 6, inside: true, holes: [], link: 'plug', check: true, mah: 500,
      tip: 'Half the size, less than half the run time. Same care as the big one: protection circuit, tape not screws, check red and black.', price: 8, src: 'Adafruit 1578: about 36 x 29 x 4.75 mm. Sellers differ, measure yours.', url: 'https://www.adafruit.com/product/1578' },
    liposhim: { cat: 'power', name: 'Pico charger (LiPo SHIM for Pico)', short: 'Pico charger', w: 21, h: 21, depth: 7, inside: true, holes: [], link: 'solder', charger: true,
      tip: 'Solders to the back of the Pico and has a power button. The battery plugs into it and charges through the Pico USB plug, so one opening does both. It rides on the Pico: its square here saves the room and keeps it on your list.', price: 9, src: 'Pimoroni PIM557: 21 x 21 x 7 mm', url: 'https://shop.pimoroni.com/products/pico-lipo-shim' },
    tp4056: { cat: 'power', name: 'USB-C Charger (TP4056)', short: 'USB-C Charger (TP4056)', w: 28, h: 17, depth: 5, inside: true, holes: [], link: 'solder', check: true, charger: true, usb: 'USB-C on a short end',
      tip: 'The cheapest way to charge. Battery to B+ and B-. OUT+ goes through the power switch, then through a 1N5817 diode (stripe toward the Pico) to the Pico VSYS pin. The diode matters: without it USB power can push back into the battery. It gets its own opening in the wall for the USB-C plug. Buy pre-soldered headers for no-solder build.', price: 1, src: 'Common TP4056 USB-C module with protection: about 28 x 17 mm. Sellers differ, measure yours.', url: '' },
    lvlshift: { cat: 'power', name: 'Logic level shifter (4 channel, BSS138)', short: 'Level shifter', w: 15, h: 13, depth: 4, inside: true, holes: [], link: 'pins', check: true,
      tip: 'Lets a 3.3V part talk to a 5V Uno safely. LV to 3V3, HV to 5V, GND to GND, then each signal goes in on the HV side and out on the LV side.', price: 1, src: 'SparkFun BOB-12009 style 4 channel board: about 15 x 13 mm', url: 'https://www.sparkfun.com/products/12009' },
    rocker: { cat: 'power', name: 'On/off switch (small rocker)', short: 'Power switch', w: 15, h: 10.5, depth: 14, cut: { o: 'rect', w: 13.2, h: 8.8 }, keep: 6, link: 'solder', check: true,
      tip: 'Snaps into the top. Wire it between the charger and the brain so off really is off.', price: 0.5, src: 'Common KCD11 rocker: about 13 x 8.5 mm opening. Sellers differ, measure yours.', url: '' },
    // ---------- movement ----------
    servo: { cat: 'move', name: 'Mini servo (SG90)', short: 'Servo', w: 23, h: 12.2, depth: 29, cut: { o: 'rect', w: 23.5, h: 12.7 }, keep: 8, link: 'plug', check: true,
      tip: 'Moves an arm, head or eyes. 3 wire plug. Pair it with the Cartoon maker to plan the moves.', price: 2, src: 'SG90: about 23 x 12.2 x 29 mm', url: '' }
  };
  // PCB tags for the Board export (BOM.csv + CPL.csv): fp = standard KiCad footprint, mpn = maker part number, lcsc = LCSC part # where one fits.
  // Modules (brains, screens, sensor boards) are hand-soldered, not factory placed, so most have no LCSC #: look the MPN up in the factory's parts search.
  C.PCB = {
    pico: { fp: 'Connector_PinSocket_2.54mm:PinSocket_1x20_P2.54mm_Vertical x2, rows 17.78 mm', mpn: 'SC0915' }, picow: { fp: 'Connector_PinSocket_2.54mm:PinSocket_1x20_P2.54mm_Vertical x2, rows 17.78 mm', mpn: 'SC0918' }, pico2: { fp: 'Connector_PinSocket_2.54mm:PinSocket_1x20_P2.54mm_Vertical x2, rows 17.78 mm', mpn: 'SC1631' },
    nano: { fp: 'Module:Arduino_Nano', mpn: 'A000005' }, promicro: { fp: 'Connector_PinSocket_2.54mm:PinSocket_1x12_P2.54mm_Vertical x2, rows 15.24 mm', mpn: 'DEV-12640' }, esp32c3: { fp: 'Connector_PinSocket_2.54mm:PinSocket_1x08_P2.54mm_Vertical x2, rows 15.24 mm', mpn: 'ESP32-C3 SuperMini' },
    tact12: { fp: 'Button_Switch_THT:SW_PUSH_12mm', mpn: 'B3F-4055' }, button16: { fp: 'Connector_PinHeader_2.54mm:PinHeader_1x02_P2.54mm_Vertical', mpn: '16 mm panel push button' },
    arcade24: { fp: 'Connector_PinHeader_2.54mm:PinHeader_1x02_P2.54mm_Vertical', mpn: 'Sanwa OBSF-24' }, arcade30: { fp: 'Connector_PinHeader_2.54mm:PinHeader_1x02_P2.54mm_Vertical', mpn: 'Sanwa OBSF-30' }, dpad: { fp: 'Button_Switch_THT:SW_PUSH_6mm', mpn: '4 x 6 mm tactile' },
    pot: { fp: 'Potentiometer_THT:Potentiometer_Bourns_PTV09A-1_Single_Vertical', mpn: 'PTV09A-4020F-B103' }, slider: { fp: 'Potentiometer_THT:Potentiometer_Bourns_PTA4543_Single_Slide', mpn: 'PTA4543-2015DPB103' },
    encoder: { fp: 'Rotary_Encoder:RotaryEncoder_Alps_EC11E-Switch_Vertical_H20mm', mpn: 'PEC11R-4220F-S0024' }, thumb: { fp: 'Connector_PinHeader_2.54mm:PinHeader_1x05_P2.54mm_Vertical', mpn: 'Adafruit 512' },
    stick: { fp: 'Connector_PinHeader_2.54mm:PinHeader_1x05_P2.54mm_Vertical', mpn: '4 way arcade stick' }, keypad44: { fp: 'Connector_PinHeader_2.54mm:PinHeader_1x08_P2.54mm_Vertical', mpn: '4x4 membrane keypad' },
    oled096: { fp: 'Connector_PinHeader_2.54mm:PinHeader_1x04_P2.54mm_Vertical', mpn: 'SSD1306 0.96 in 128x64 I2C' }, tft28: { fp: 'Connector_PinHeader_2.54mm:PinHeader_1x09_P2.54mm_Vertical', mpn: 'ILI9341 2.8 in SPI' },
    round128: { fp: 'Connector_PinHeader_2.54mm:PinHeader_1x08_P2.54mm_Vertical', mpn: 'GC9A01 1.28 in round' }, led5: { fp: 'LED_THT:LED_D5.0mm', mpn: '5 mm LED + 220R' },
    ring12: { fp: 'Connector_PinHeader_2.54mm:PinHeader_1x03_P2.54mm_Vertical', mpn: 'Adafruit 1643' }, speaker28: { fp: 'Connector_PinHeader_2.54mm:PinHeader_1x02_P2.54mm_Vertical', mpn: '28 mm 8 ohm speaker' },
    mat8: { fp: 'Connector_PinHeader_2.54mm:PinHeader_1x05_P2.54mm_Vertical', mpn: 'MAX7219 8x8 module' }, jack35: { fp: 'Connector_Audio:Jack_3.5mm_CUI_SJ1-3523N_Horizontal', mpn: 'SJ1-3523N' },
    dfplayer: { fp: 'Connector_PinHeader_2.54mm:PinHeader_1x08_P2.54mm_Vertical x2', mpn: 'DFR0299' }, sdcard: { fp: 'Connector_PinHeader_2.54mm:PinHeader_1x06_P2.54mm_Vertical', mpn: 'MicroSD SPI module' },
    lcd1602: { fp: 'Connector_PinHeader_2.54mm:PinHeader_1x04_P2.54mm_Vertical', mpn: 'LCD1602 + PCF8574' }, lvlshift: { fp: 'Connector_PinHeader_2.54mm:PinHeader_1x06_P2.54mm_Vertical x2', mpn: 'BOB-12009' },
    i2sdac: { fp: 'Connector_PinHeader_2.54mm:PinHeader_1x06_P2.54mm_Vertical', mpn: 'PCM5102A module' }, inmp441: { fp: 'Connector_PinHeader_2.54mm:PinHeader_1x06_P2.54mm_Vertical', mpn: 'INMP441 module' },
    pir: { fp: 'Connector_PinHeader_2.54mm:PinHeader_1x03_P2.54mm_Vertical', mpn: 'HC-SR501' }, vl53: { fp: 'Connector_PinHeader_2.54mm:PinHeader_1x04_P2.54mm_Vertical', mpn: 'Adafruit 3317' },
    arducam: { fp: 'Connector_PinHeader_2.54mm:PinHeader_1x08_P2.54mm_Vertical', mpn: 'ArduCAM Mini 2MP' }, servo: { fp: 'Connector_PinHeader_2.54mm:PinHeader_1x03_P2.54mm_Vertical', mpn: 'SG90' },
    _diode: { fp: 'Diode_THT:D_DO-41_SOD81_P10.16mm_Horizontal', mpn: '1N5817' }, _hdr: { fp: 'Connector_PinSocket_2.54mm:PinSocket_1x{n}_P2.54mm_Vertical', mpn: '2.54 mm female header 1x{n}' }
  };
  Object.keys(C.PCB).forEach(function (k) { var P = C.PARTS[k]; if (P) { P.fp = C.PCB[k].fp; P.mpn = C.PCB[k].mpn; P.lcsc = C.PCB[k].lcsc || ''; } });
  // searchQuery: clean store search words (no parentheses or commas) so Amazon, Adafruit and AliExpress always find the part.
  var SQ = { pico: 'Raspberry Pi Pico H', picow: 'Raspberry Pi Pico WH', pico2: 'Raspberry Pi Pico 2', uno: 'Elegoo Uno R3', nano: 'Arduino Nano ATmega328P', promicro: 'Pro Micro ATmega32U4',
    esp32c3: 'ESP32 C3 SuperMini', esp32s3: 'ESP32 S3 DevKitC 1 N16R8', esp32: 'ESP32 DevKit V1 30 pin', zero2: 'Raspberry Pi Zero 2 W', pi5: 'Raspberry Pi 5', cyd: 'ESP32 2432S028 Cheap Yellow Display', tft28: 'ILI9341 2.8 inch SPI TFT', round128: 'GC9A01 round display 1.28',
    oled096: 'SSD1306 OLED 0.96 I2C', hdmi5: '5 inch HDMI display 800x480', hdmi7: '7 inch HDMI display 1024x600', tact12: '12mm tactile button cap', button16: '16mm momentary push button', arcade24: '24mm arcade button',
    arcade30: '30mm arcade button', keypad44: '4x4 matrix keypad', dpad: '6x6mm tactile switch', arducam: 'Arducam Mini 2MP OV2640', pir: 'HC-SR501 PIR sensor', vl53: 'VL53L0X distance sensor', esp32cam: 'ESP32-CAM',
    pot: '10K potentiometer', encoder: 'KY-040 rotary encoder', thumb: 'KY-023 joystick module', stick: 'Sanwa JLF joystick', slider: '60mm slide potentiometer', led5: '5mm LED assortment', ring12: 'WS2812 12 LED ring',
    speaker28: '28mm mini speaker', mat8: 'MAX7219 8x8 LED matrix', jack35: '3.5mm audio jack breakout', i2sdac: 'MAX98357A I2S amplifier', inmp441: 'INMP441 I2S microphone', lipo1200: '1200mAh LiPo battery JST',
    lipo500: '500mAh LiPo battery JST', liposhim: 'LiPo SHIM for Pico', tp4056: 'TP4056 USB C LiPo charger', rocker: 'mini rocker switch', dfplayer: 'DFPlayer Mini MP3 module', sdcard: 'Micro SD card reader module SPI', lcd1602: 'LCD1602 I2C module', lvlshift: 'logic level converter 4 channel', servo: 'SG90 micro servo' };
  Object.keys(C.PARTS).forEach(function (k) { C.PARTS[k].searchQuery = SQ[k] || (C.PARTS[k].find || C.PARTS[k].name).replace(/\([^)]*\)/g, ' ').replace(/[,/]+/g, ' ').replace(/\s+/g, ' ').trim(); });
  C.cleanQuery = function (t) { return String(t || '').replace(/\([^)]*\)/g, ' ').replace(/[(),/]+/g, ' ').replace(/\s+/g, ' ').trim(); };
  // Cheap starter kits and assortments: one bag covers many builds. [name, Amazon search words, why]
  C.KITS = [
    ['Elegoo Uno Starter Kit', 'Elegoo Uno R3 starter kit', 'An Uno, jumper wires, buttons, LEDs, a breadboard and more in one box.'],
    ['Tactile Button Pack', 'tactile push button assortment kit', 'Hundreds of 6 and 12 mm buttons with caps for a few dollars.'],
    ['Potentiometer Kit', 'potentiometer assortment kit with knobs', 'Every common knob value, with knob caps.'],
    ['Jumper Wire Pack', 'dupont jumper wire kit female to female', 'Female to female, male to female: no solder wiring.']
  ];
  // Recipes (new 11-13): a known device to start from. Each one loads a shape and a parts list, and credits the open project its code comes from.
  // parts: [type, how many]. tested: false until NOCIV has built it for real. Nothing here copies their code: we link to it.
  C.RECIPES = [
    { id: 'beat', name: 'Beat maker', level: 'Easy', short: '8-step beat maker with a screen', group: 'music', style: 'groove', line: '8 steps, a click wheel and a small screen. Sends the beat over USB to a music app or synth.',
      parts: [['pico', 1], ['oled096', 1], ['encoder', 1], ['tact12', 8]], size: [10, 5],
      place: [['pico', 31, 76, 0], ['oled096', 82, 76, 0], ['encoder', 165, 76, 0]].concat([0, 1, 2, 3, 4, 5, 6, 7].map(function (i) { return ['tact12', 26 + i * 22.2, 32, 0]; })),
      credit: { project: 'PicoStepSeq', by: 'Tod Kurt (todbot)', url: 'https://github.com/todbot/picostepseq', license: 'GPL-3.0' },
      note: 'Their build uses step switches with a light in each one. This layout uses plain small buttons in their place.' },
    { id: 'midi', name: 'DJ pad', level: 'Easy', short: '16 arcade pads for any music app', group: 'music', style: 'slate', line: '16 arcade buttons that play notes and samples in any music app over USB.',
      parts: [['pico', 1], ['oled096', 1], ['arcade24', 16]], size: [9, 7],
      place: [['pico', 20, 62, 1], ['oled096', 20, 121, 0]].concat([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(function (i) { return ['arcade24', 52 + (i % 4) * 33, 121 - Math.floor(i / 4) * 33, 0]; })),
      credit: { project: 'Pico LED Arcade Button MIDI Controller', by: 'Ruiz Brothers and Liz Clark, Adafruit', url: 'https://learn.adafruit.com/raspberry-pi-pico-led-arcade-button-midi-controller-fighter', license: 'see the guide' },
      note: 'Their build uses lit arcade buttons, a 1.5 in screen and an extra board for the lights. This layout uses plain 24 mm buttons and the small screen.' },
    { id: 'gb', name: 'Game handheld', level: 'Medium', short: 'Plays the Game Boy games you own', group: 'games', style: 'hand', line: 'A pocket handheld that plays original Game Boy games you own.',
      parts: [['pico', 1], ['tft28', 1], ['dpad', 1], ['tact12', 4], ['speaker28', 1], ['lipo1200', 1], ['liposhim', 1]], size: [5, 8], add: 10,
      place: [['tft28', 53.7, 132, 0], ['dpad', 28, 76, 0], ['tact12', 74, 70, 0], ['tact12', 91, 82, 0], ['tact12', 38, 40, 0], ['tact12', 57, 40, 0], ['speaker28', 84, 40, 0], ['pico', 29.5, 120, 0], ['lipo1200', 53.7, 88, 0], ['liposhim', 90, 128, 0]],
      credit: { project: 'Pico-GB', by: 'YouMakeTech, built on RP2040-GB by deltabeard', url: 'https://github.com/YouMakeTech/Pico-GB', license: 'MIT' },
      note: 'Their code is written for a 2.2 in ILI9225 screen, so with the 2.8 in screen here the screen part of the code needs changing. Not every game runs, and it runs the Pico faster than normal. Bring your own game files.' },
    { id: 'desk', name: 'Offline desk assistant', level: 'Hard', short: 'Talk to it, it answers. Fully offline', group: 'desk', style: 'face', line: 'Talk to it, it answers out loud. Nothing leaves the box.',
      parts: [['pi5', 1], ['round128', 1], ['speaker28', 1], ['button16', 1]],
      credit: { project: 'Ollama + Whisper + Piper', by: 'the Ollama, OpenAI Whisper and Piper projects', url: 'https://ollama.com', license: 'each has its own' },
      note: 'Needs a Pi 5 with 8 GB (about $100, more than the price shown here), a USB microphone and a memory card. Answers take several seconds. An old laptop or phone you already own is a cheaper brain.' },
    // Starter builds: body, brain and printed parts in one go. Their code is the starter code.py the builder writes from the wiring.
    { id: 'macro4', name: '4-Button Macro Pad', level: 'Easy', short: '4 buttons that type your shortcuts', group: 'desk', style: 'slate', starter: true, fn: 'macro', line: '4 big buttons that type shortcuts on your computer over USB. Feet underneath.',
      parts: [['pico', 1], ['button16', 4]], size: [5, 5],
      place: [['button16', 21.7, 82, 0], ['button16', 43.7, 82, 0], ['button16', 65.7, 82, 0], ['button16', 87.7, 82, 0], ['pico', 53.7, 40, 0]],
      mounts: [{ partId: 'feet', face: 'bottom', anchor: { u: 1, v: 0 }, mountType: 'snap' }, { partId: 'feet', face: 'bottom', anchor: { u: 3, v: 0 }, mountType: 'snap' }, { partId: 'feet', face: 'bottom', anchor: { u: 0, v: 2 }, mountType: 'snap' }, { partId: 'feet', face: 'bottom', anchor: { u: 4, v: 2 }, mountType: 'snap' }],
      credit: { project: 'Case Zero starter code', by: 'this builder, made from your wiring', url: 'https://nociv.co/casezero/build/', license: 'free to use and change' },
      note: 'Its code.py sends Ctrl+C, Ctrl+V, Ctrl+Z and Play/Pause (set MAC = True for Cmd). The Pico shows up as a keyboard, nothing to install on the computer.' },
    { id: 'timer', name: 'Desk Timer', level: 'Easy', short: 'Turn, press, it beeps when done', group: 'desk', style: 'slate', starter: true, fn: 'timer', line: 'Turn the wheel to set the minutes, press start, it beeps when the time is up. Leans back on a kickstand.',
      parts: [['pico', 1], ['oled096', 1], ['encoder', 1], ['button16', 1], ['speaker28', 1]], size: [6, 4],
      place: [['oled096', 40, 62, 0], ['encoder', 100, 62, 0], ['button16', 105, 25, 0], ['speaker28', 30, 25, 0], ['pico', 64, 22, 0]],
      mounts: [{ partId: 'stand', face: 'bottom', anchor: { u: 2, v: 2 }, mountType: 'screw' }],
      ports: [{ kind: 'p_vent', face: 'right', u: 1 }],
      credit: { project: 'Case Zero starter code', by: 'this builder, made from your wiring', url: 'https://nociv.co/casezero/build/', license: 'free to use and change' },
      note: 'Its code.py runs a 25:00 countdown: press the button to start or pause, hold it 1 s to reset, turn the wheel to set the minutes. It beeps at 00:00.' },
    { id: 'synth', name: 'Mini Synth', level: 'Medium', short: '8 keys and knobs that play notes', group: 'music', style: 'groove', starter: true, fn: 'synth', line: '8 keys, 2 knobs and 2 click wheels that play notes in any music app over USB. A handle on the back to carry it.',
      parts: [['pico', 1], ['oled096', 1], ['pot', 2], ['encoder', 2], ['tact12', 8], ['speaker28', 1]], size: [10, 6],
      place: [['pico', 31, 76, 0], ['oled096', 70, 76, 0], ['pot', 100, 76, 0], ['pot', 122, 76, 0], ['encoder', 152, 76, 0], ['encoder', 186, 76, 0], ['speaker28', 184, 102, 0]].concat([0, 1, 2, 3, 4, 5, 6, 7].map(function (i) { return ['tact12', 26 + i * 22.2, 32, 0]; })),
      mounts: [{ partId: 'handle', face: 'back', anchor: { u: 1 }, mountType: 'screw' }],
      ports: [{ kind: 'p_vent', face: 'right', u: 2 }],
      credit: { project: 'Case Zero starter code', by: 'this builder, made from your wiring', url: 'https://nociv.co/casezero/build/', license: 'free to use and change' },
      note: 'Its code.py plays a note per key on the speaker; knob 1 moves the pitch, knob 2 the tempo of the arpeggio while you hold a key. The 2 click wheels are free for your own ideas: each one already prints its count.' }
    ,{ id: 'sampler', name: 'Voice Sampler', level: 'Medium', short: '12 pads to chop and play sounds', group: 'music', style: 'groove', starter: true, fn: 'sampler', line: '12 pads that play sounds, 3 modes (Chopper, Drum, Ambient), Pitch and Effect wheels, a stick to scrub and set the level. Plays out of a headphone jack and over USB MIDI.',
      parts: [['pico', 1], ['keypad44', 1], ['encoder', 2], ['thumb', 1], ['oled096', 1], ['mat8', 1], ['jack35', 1]], size: [10, 7],
      place: [['keypad44', 45, 72, 0], ['oled096', 100, 112, 0], ['mat8', 140, 112, 0], ['encoder', 107, 60, 0], ['encoder', 152, 60, 0], ['thumb', 182, 112, 0], ['pico', 60, 18, 0], ['jack35', 174, 138, 0]],
      ports: [{ kind: 'p_jack', face: 'back', u: 8 }],
      credit: { project: 'Case Zero starter code', by: 'this builder, made from your wiring', url: 'https://nociv.co/casezero/build/', license: 'free to use and change' },
      note: 'Its code.py plays a sound per pad out of the jack and sends it as a USB MIDI note. The keypad\'s right column is Mode (Chopper, Drum, Ambient), Bank, Record and Stop. Wheel 1 is Pitch, wheel 2 Effect; the stick scrubs left and right and sets the level up and down. With the I2S mic, main.py (MicroPython) records it.' }
  ];
  // Body presets: one open-source starter per body shape. preset: true shows it on the Shape page. play = its PLAY simulation.
  // links (repos and libraries) show only in Build, Guide & Code. code = a starter file that proves the wiring, also in Guide & Code.
  C.RECIPES.push(
    { id: 'deskbot', preset: true, play: 'deskbot', name: 'AI Desk-Bot', level: 'Medium', cost: '~$25–$40', short: 'Eyes, a voice and a turning head', group: 'desk', style: 'face',
      line: 'Press the wake button: OLED eyes open, it plays a chime and the servo turns its head. Mic and speaker are ready for a voice assistant.',
      parts: [['esp32s3', 1], ['oled096', 1], ['inmp441', 1], ['i2sdac', 1], ['speaker28', 1], ['servo', 1], ['tact12', 1]],
      credit: { project: 'xiaozhi-esp32', by: '78 (Xiaozhi open-source AI chatbot)', url: 'https://github.com/78/xiaozhi-esp32', license: 'MIT' },
      links: [['xiaozhi-esp32', 'https://github.com/78/xiaozhi-esp32', 'Full voice assistant firmware for ESP32-S3 + INMP441 + MAX98357A + OLED'], ['Adafruit SSD1306', 'https://github.com/adafruit/Adafruit_SSD1306', 'OLED eyes'], ['ESP32Servo', 'https://github.com/madhephaestus/ESP32Servo', 'Servo on the ESP32-S3'], ['Arduino-ESP32 (ESP_I2S built in)', 'https://github.com/espressif/arduino-esp32', 'Board package 3.x: I2S mic and amp']],
      note: 'The starter sketch below is NOCIV code: wake button, eyes, chime and servo. For talking to it, flash xiaozhi-esp32 (it needs Wi-Fi and its own server or theirs).',
      code: [['deskbot.ino', `// AI Desk-Bot starter (NOCIV). Board: ESP32S3 Dev Module, PSRAM: OPI PSRAM. Arduino-ESP32 3.x.
// Libraries: Adafruit SSD1306 + Adafruit GFX, ESP32Servo. ESP_I2S comes with the board package.
// Wiring: OLED SDA 8, SCL 9 | Button 4 to GND | Servo signal 18 (power 5V) |
// MAX98357A BCLK 15, LRC 16, DIN 7 | INMP441 SCK 5, WS 6, SD 17, L/R to GND
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <ESP32Servo.h>
#include <ESP_I2S.h>

Adafruit_SSD1306 oled(128, 64, &Wire, -1);
Servo head;
I2SClass spk, mic;
const int BTN = 4;

void eyes(int h) {
  oled.clearDisplay();
  oled.fillRoundRect(24, 32 - h / 2, 28, h, 6, SSD1306_WHITE);
  oled.fillRoundRect(76, 32 - h / 2, 28, h, 6, SSD1306_WHITE);
  oled.display();
}

void chime() {
  static int16_t buf[1600];
  const float notes[2] = {880.0, 1318.5};
  for (int n = 0; n < 2; n++) {
    for (int i = 0; i < 1600; i++) buf[i] = (int16_t)(6000 * sin(2 * PI * notes[n] * i / 16000.0) * (1.0 - i / 1600.0));
    spk.write((uint8_t *)buf, sizeof(buf));
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(BTN, INPUT_PULLUP);
  Wire.begin(8, 9);
  oled.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  head.attach(18);
  head.write(90);
  spk.setPins(15, 16, 7);
  spk.begin(I2S_MODE_STD, 16000, I2S_DATA_BIT_WIDTH_16BIT, I2S_SLOT_MODE_MONO);
  mic.setPins(5, 6, -1, 17);
  mic.begin(I2S_MODE_STD, 16000, I2S_DATA_BIT_WIDTH_32BIT, I2S_SLOT_MODE_MONO);
  eyes(4); // asleep
}

void loop() {
  if (digitalRead(BTN) == LOW) {
    eyes(26);
    chime();
    for (int a = 90; a >= 0; a -= 3) { head.write(a); delay(10); }
    for (int a = 0; a <= 180; a += 3) { head.write(a); delay(10); }
    for (int a = 180; a >= 90; a -= 3) { head.write(a); delay(10); }
    Serial.printf("mic sample: %d\\r\\n", mic.read());
    delay(1500);
    eyes(4);
  }
}
`]] },
    { id: 'scanner', preset: true, play: 'scanner', name: 'Mini 3D Scanner', level: 'Easy', cost: '~$12–$18', short: 'A laser distance sweep on a servo', group: 'make', style: 'mini',
      line: 'A servo sweeps a laser distance sensor from 0 to 180 degrees. The OLED draws what it sees and Serial prints (angle, mm) for a 3D point cloud.',
      parts: [['pico', 1], ['vl53', 1], ['servo', 1], ['oled096', 1], ['tact12', 1]],
      credit: { project: 'Adafruit CircuitPython VL53L0X', by: 'Adafruit', url: 'https://github.com/adafruit/Adafruit_CircuitPython_VL53L0X', license: 'MIT' },
      links: [['Adafruit CircuitPython VL53L0X', 'https://github.com/adafruit/Adafruit_CircuitPython_VL53L0X', 'The distance sensor driver'], ['Adafruit CircuitPython DisplayIO SSD1306', 'https://github.com/adafruit/Adafruit_CircuitPython_DisplayIO_SSD1306', 'The OLED'], ['Adafruit CircuitPython Motor', 'https://github.com/adafruit/Adafruit_CircuitPython_Motor', 'The servo'], ['Adafruit_VL53L0X (Arduino)', 'https://github.com/adafruit/Adafruit_VL53L0X', 'For an ESP32 build in Arduino']],
      note: 'An ESP32 DevKit works too: same parts, use the Arduino library. Add a second servo for tilt to scan in full 3D.',
      code: [['code.py', `# Mini 3D Scanner (NOCIV starter). CircuitPython 9 on a Raspberry Pi Pico.
# lib/: adafruit_vl53l0x, adafruit_displayio_ssd1306, adafruit_motor
# Wiring: I2C SDA GP4, SCL GP5 (OLED 0x3C + VL53L0X 0x29) | Servo GP15 (5V from VBUS) | Button GP14 to GND
import math, time, board, busio, digitalio, displayio, pwmio, i2cdisplaybus
import adafruit_vl53l0x, adafruit_displayio_ssd1306
from adafruit_motor import servo

displayio.release_displays()
i2c = busio.I2C(board.GP5, board.GP4)
tof = adafruit_vl53l0x.VL53L0X(i2c)
bus = i2cdisplaybus.I2CDisplayBus(i2c, device_address=0x3C)
oled = adafruit_displayio_ssd1306.SSD1306(bus, width=128, height=64)
bmp = displayio.Bitmap(128, 64, 2)
pal = displayio.Palette(2)
pal[1] = 0xFFFFFF
root = displayio.Group()
root.append(displayio.TileGrid(bmp, pixel_shader=pal))
oled.root_group = root
arm = servo.Servo(pwmio.PWMOut(board.GP15, frequency=50))
btn = digitalio.DigitalInOut(board.GP14)
btn.switch_to_input(pull=digitalio.Pull.UP)
MAX_MM = 1200

def sweep(angles):
    for a in angles:
        arm.angle = a
        time.sleep(0.04)
        mm = tof.range
        print((a, mm))  # the Serial log: (angle, mm)
        r = min(mm, MAX_MM) * 60 // MAX_MM
        x = 64 + int(math.cos(math.radians(a)) * r)
        y = 63 - int(math.sin(math.radians(a)) * r)
        if 0 <= x < 128 and 0 <= y < 64:
            bmp[x, y] = 1

while True:
    if not btn.value:  # press to start a new scan
        bmp.fill(0)
        sweep(range(0, 181, 5))
        sweep(range(180, -1, -5))
    time.sleep(0.05)
`]] },
    { id: 'retrocam', preset: true, play: 'retrocam', name: 'Retro Cam / Wiggle-Cam', level: 'Medium', cost: '~$12–$18', short: 'A pocket camera with an OLED viewfinder', group: 'make', style: 'camera',
      line: 'An ESP32-CAM with a tiny monochrome viewfinder and a shutter button. Add an SG90 for Wiggle mode: two shots from side to side.',
      parts: [['esp32cam', 1], ['oled096', 1], ['tact12', 1]],
      credit: { project: 'DIY-Camera', by: 'derdacavga', url: 'https://github.com/derdacavga/DIY-Camera', license: 'see the repo' },
      links: [['derdacavga/DIY-Camera', 'https://github.com/derdacavga/DIY-Camera', 'The full camera project'], ['espressif/esp32-camera', 'https://github.com/espressif/esp32-camera', 'Camera driver (comes with Arduino-ESP32)'], ['Adafruit SSD1306', 'https://github.com/adafruit/Adafruit_SSD1306', 'The OLED viewfinder']],
      note: 'The ESP32-CAM has no USB plug: Shop adds the $2 ESP32-CAM-MB programmer. Wiggle mode needs 1 SG90 (about $2) on GPIO 2. This starter shows the viewfinder and counts shots; DIY-Camera shows saving to the SD card.',
      code: [['retrocam.ino', `// Retro Cam starter (NOCIV). Board: AI Thinker ESP32-CAM, program it through the ESP32-CAM-MB.
// Libraries: Adafruit SSD1306 + Adafruit GFX. esp_camera comes with Arduino-ESP32.
// Wiring: OLED SDA 15, SCL 14 | Shutter 13 to GND | Wiggle servo (optional) 2
#include "esp_camera.h"
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

Adafruit_SSD1306 oled(128, 64, &Wire, -1);
const int SHUTTER = 13;
int shots = 0;

void setup() {
  Serial.begin(115200);
  pinMode(SHUTTER, INPUT_PULLUP);
  Wire.begin(15, 14);
  oled.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  camera_config_t c = {};
  c.pin_pwdn = 32; c.pin_reset = -1; c.pin_xclk = 0; c.pin_sccb_sda = 26; c.pin_sccb_scl = 27;
  c.pin_d7 = 35; c.pin_d6 = 34; c.pin_d5 = 39; c.pin_d4 = 36; c.pin_d3 = 21; c.pin_d2 = 19; c.pin_d1 = 18; c.pin_d0 = 5;
  c.pin_vsync = 25; c.pin_href = 23; c.pin_pclk = 22;
  c.xclk_freq_hz = 20000000; c.ledc_timer = LEDC_TIMER_0; c.ledc_channel = LEDC_CHANNEL_0;
  c.pixel_format = PIXFORMAT_GRAYSCALE; c.frame_size = FRAMESIZE_QQVGA; c.fb_count = 1;
  if (esp_camera_init(&c) != ESP_OK) Serial.println("Camera not found");
}

void loop() {
  camera_fb_t *fb = esp_camera_fb_get();
  if (!fb) return;
  oled.clearDisplay();
  for (int y = 0; y < 64; y++)
    for (int x = 0; x < 128; x++)
      if (fb->buf[(y * 120 / 64) * 160 + (x * 160 / 128)] > 110) oled.drawPixel(x, y, SSD1306_WHITE);
  esp_camera_fb_return(fb);
  oled.setCursor(0, 0);
  oled.setTextColor(SSD1306_WHITE, SSD1306_BLACK);
  oled.printf("SHOTS %d", shots);
  oled.display();
  if (digitalRead(SHUTTER) == LOW) {
    shots++;
    Serial.printf("Shot %d\\r\\n", shots);
    oled.invertDisplay(true); delay(80); oled.invertDisplay(false);
    while (digitalRead(SHUTTER) == LOW) delay(10);
  }
}
`]] },
    { id: 'gamepad', preset: true, play: 'gamepad', name: 'Wireless Gamepad', level: 'Medium', cost: '~$15–$22', short: 'A Bluetooth controller with two sticks', group: 'games', style: 'pad',
      line: 'Two thumbsticks, a D-pad and 6 buttons over Bluetooth LE. Pairs like any store-bought gamepad.',
      parts: [['esp32', 1], ['thumb', 2], ['dpad', 1], ['tact12', 6]],
      credit: { project: 'ESP32-BLE-Gamepad', by: 'lemmingDev', url: 'https://github.com/lemmingDev/ESP32-BLE-Gamepad', license: 'MIT' },
      links: [['lemmingDev/ESP32-BLE-Gamepad', 'https://github.com/lemmingDev/ESP32-BLE-Gamepad', 'Turns the ESP32 into a BLE gamepad'], ['h2zero/NimBLE-Arduino', 'https://github.com/h2zero/NimBLE-Arduino', 'The Bluetooth LE stack it needs: install both']],
      note: 'Works with PC, Android and Linux. Not iOS: iPhones and iPads do not accept this kind of custom Bluetooth gamepad. Sticks go on ADC1 pins because ADC2 stops working while Bluetooth is on.',
      code: [['gamepad.ino', `// Wireless Gamepad starter (NOCIV). Board: ESP32 Dev Module (ESP32 DevKit V1).
// Libraries: ESP32-BLE-Gamepad (lemmingDev) + NimBLE-Arduino (h2zero).
// Works with PC, Android and Linux. Not iOS.
// Wiring: Left stick X 34, Y 35 | Right stick X 32, Y 33 (ADC1 only) | sticks to 3V3 + GND
//         D-pad up 25, down 26, left 27, right 14 | Buttons 16, 17, 18, 19, 21, 22 | all buttons to GND
#include <BleGamepad.h>

BleGamepad pad("Case Zero Pad", "NOCIV", 100);
const int BTN[6] = {16, 17, 18, 19, 21, 22};
const int UP = 25, DOWN = 26, LEFT = 27, RIGHT = 14;

int axis(int pin) { return map(analogRead(pin), 0, 4095, 0, 32767); }

void setup() {
  for (int i = 0; i < 6; i++) pinMode(BTN[i], INPUT_PULLUP);
  pinMode(UP, INPUT_PULLUP); pinMode(DOWN, INPUT_PULLUP); pinMode(LEFT, INPUT_PULLUP); pinMode(RIGHT, INPUT_PULLUP);
  BleGamepadConfiguration cfg;
  cfg.setButtonCount(6);
  cfg.setHatSwitchCount(1);
  pad.begin(&cfg);
}

void loop() {
  if (!pad.isConnected()) { delay(100); return; }
  pad.setX(axis(34)); pad.setY(axis(35));
  pad.setZ(axis(32)); pad.setRZ(axis(33));
  for (int i = 0; i < 6; i++) { if (digitalRead(BTN[i]) == LOW) pad.press(i + 1); else pad.release(i + 1); }
  bool u = !digitalRead(UP), d = !digitalRead(DOWN), l = !digitalRead(LEFT), r = !digitalRead(RIGHT);
  uint8_t hat = HAT_CENTERED;
  if (u && r) hat = HAT_UP_RIGHT; else if (u && l) hat = HAT_UP_LEFT; else if (d && r) hat = HAT_DOWN_RIGHT; else if (d && l) hat = HAT_DOWN_LEFT;
  else if (u) hat = HAT_UP; else if (d) hat = HAT_DOWN; else if (l) hat = HAT_LEFT; else if (r) hat = HAT_RIGHT;
  pad.setHat1(hat);
  delay(10);
}
`]] },
    { id: 'cyddeck', preset: true, play: 'cyd', name: 'CYD Touch Deck', level: 'Easy', cost: '~$12–$15', short: 'A 2.8 in touch panel of buttons', group: 'make', style: 'slate',
      line: 'One board, no wiring: tap tiles on the 2.8 in touch screen and the RGB LED shows what is on.',
      parts: [['cyd', 1]],
      credit: { project: 'ESP32-Cheap-Yellow-Display', by: 'Brian Lough (witnessmenow) and community', url: 'https://github.com/witnessmenow/ESP32-Cheap-Yellow-Display', license: 'MIT' },
      links: [['witnessmenow/ESP32-Cheap-Yellow-Display', 'https://github.com/witnessmenow/ESP32-Cheap-Yellow-Display', 'Setup, pinout and examples. Copy its DisplayConfig/User_Setup.h into TFT_eSPI'], ['Bodmer/TFT_eSPI', 'https://github.com/Bodmer/TFT_eSPI', 'The screen'], ['PaulStoffregen/XPT2046_Touchscreen', 'https://github.com/PaulStoffregen/XPT2046_Touchscreen', 'The touch']],
      note: 'Touch is on its own SPI pins (CLK 25, MISO 39, MOSI 32, CS 33, IRQ 36). The RGB LED is on 4, 16 and 17 and lights when the pin is LOW.',
      code: [['cyddeck.ino', `// CYD Touch Deck starter (NOCIV). Board: ESP32 Dev Module.
// Libraries: TFT_eSPI (with the CYD User_Setup.h from witnessmenow/ESP32-Cheap-Yellow-Display), XPT2046_Touchscreen.
#include <SPI.h>
#include <TFT_eSPI.h>
#include <XPT2046_Touchscreen.h>

#define T_IRQ 36
#define T_MOSI 32
#define T_MISO 39
#define T_CLK 25
#define T_CS 33
SPIClass touchSpi(VSPI);
XPT2046_Touchscreen ts(T_CS, T_IRQ);
TFT_eSPI tft;
const int LED_R = 4, LED_G = 16, LED_B = 17; // LOW = on
const char *NAMES[6] = {"Lights", "Music", "Fan", "Timer", "Scene", "Wi-Fi"};
bool on[6];

void led(int t) {
  digitalWrite(LED_R, !(on[t] && (t == 0 || t == 3)));
  digitalWrite(LED_G, !(on[t] && (t == 1 || t == 4)));
  digitalWrite(LED_B, !(on[t] && (t == 2 || t == 5)));
}

void tile(int i) {
  int x = 8 + (i % 3) * 104, y = 40 + (i / 3) * 96;
  tft.fillRoundRect(x, y, 96, 88, 10, on[i] ? TFT_GREEN : TFT_DARKGREY);
  tft.setTextColor(TFT_BLACK);
  tft.drawCentreString(NAMES[i], x + 48, y + 36, 2);
}

void setup() {
  pinMode(LED_R, OUTPUT); pinMode(LED_G, OUTPUT); pinMode(LED_B, OUTPUT);
  digitalWrite(LED_R, HIGH); digitalWrite(LED_G, HIGH); digitalWrite(LED_B, HIGH);
  touchSpi.begin(T_CLK, T_MISO, T_MOSI, T_CS);
  ts.begin(touchSpi);
  ts.setRotation(1);
  tft.init();
  tft.setRotation(1);
  tft.fillScreen(TFT_BLACK);
  tft.setTextColor(TFT_WHITE);
  tft.drawString("CYD Touch Deck", 8, 10, 4);
  for (int i = 0; i < 6; i++) tile(i);
}

void loop() {
  if (ts.tirqTouched() && ts.touched()) {
    TS_Point p = ts.getPoint();
    int x = map(p.x, 200, 3700, 0, 320), y = map(p.y, 240, 3800, 0, 240);
    if (y > 40) {
      int i = min(2, x / 107) + (y > 136 ? 3 : 0);
      on[i] = !on[i];
      tile(i);
      led(i);
      delay(250);
    }
  }
}
`]] },
    { id: 'arcade', preset: true, play: 'arcade', name: 'Pocket Arcade', level: 'Medium', cost: '~$18–$25', short: 'A Pico handheld with a 2.8 in screen', group: 'games', style: 'hand',
      line: 'D-pad, 4 buttons and a speaker around a 2.8 in screen. Test it with the sprite starter, then flash Pico-GB to play the Game Boy games you own.',
      parts: [['pico', 1], ['tft28', 1], ['dpad', 1], ['tact12', 4], ['speaker28', 1]],
      credit: { project: 'Pico-GB', by: 'YouMakeTech, built on RP2040-GB by deltabeard', url: 'https://github.com/YouMakeTech/Pico-GB', license: 'MIT' },
      links: [['YouMakeTech/Pico-GB', 'https://github.com/YouMakeTech/Pico-GB', 'Game Boy emulator firmware for the Pico (.uf2)'], ['deltabeard/RP2040-GB', 'https://github.com/deltabeard/RP2040-GB', 'The emulator it is built on'], ['Adafruit CircuitPython ILI9341', 'https://github.com/adafruit/Adafruit_CircuitPython_ILI9341', 'The screen, for the sprite starter']],
      note: 'Pico-GB is written for a 2.2 in ILI9225 screen, so with the 2.8 in ILI9341 here its screen code needs changing. Bring your own game files.',
      code: [['code.py', `# Pocket Arcade starter (NOCIV). CircuitPython 9 on a Raspberry Pi Pico. Tests every button and the speaker.
# lib/: adafruit_ili9341
# Wiring: Screen SCK GP18, MOSI GP19, CS GP17, DC GP20, RST GP21 | D-pad GP2 up, GP3 down, GP4 left, GP5 right
#         Buttons GP6 A, GP7 B, GP8 X, GP9 Y (all to GND) | Speaker GP15 (through a 100 ohm resistor)
import time, board, busio, digitalio, displayio, fourwire, pwmio, vectorio
import adafruit_ili9341

displayio.release_displays()
spi = busio.SPI(board.GP18, MOSI=board.GP19)
bus = fourwire.FourWire(spi, command=board.GP20, chip_select=board.GP17, reset=board.GP21)
tft = adafruit_ili9341.ILI9341(bus, width=320, height=240)
pal = displayio.Palette(1)
pal[0] = 0xFFD23F
hero = vectorio.Rectangle(pixel_shader=pal, width=16, height=16, x=152, y=112)
root = displayio.Group()
root.append(hero)
tft.root_group = root

def pin(p):
    b = digitalio.DigitalInOut(p)
    b.switch_to_input(pull=digitalio.Pull.UP)
    return b

up, down, left, right = pin(board.GP2), pin(board.GP3), pin(board.GP4), pin(board.GP5)
keys = [pin(p) for p in (board.GP6, board.GP7, board.GP8, board.GP9)]
spk = pwmio.PWMOut(board.GP15, duty_cycle=0, frequency=440, variable_frequency=True)

def blip(f, t=0.04):
    spk.frequency = f
    spk.duty_cycle = 32768
    time.sleep(t)
    spk.duty_cycle = 0

while True:
    dx = (not right.value) - (not left.value)
    dy = (not down.value) - (not up.value)
    if dx or dy:
        hero.x = max(0, min(304, hero.x + dx * 4))
        hero.y = max(0, min(224, hero.y + dy * 4))
        blip(220, 0.01)
    for i, k in enumerate(keys):
        if not k.value:
            blip((523, 659, 784, 1047)[i])
    time.sleep(0.02)
`]] }
  );
  // Community picks (Reddit, Instructables, maker blogs): cheap and well documented.
  C.PICKS = [
    ['cyd', 'The Cheap Yellow Display', 'Brain plus touch screen on one board, around $15. Huge community.'],
    ['round128', 'Round watch screen', 'Watch faces, gauges and robot eyes.'],
    ['pico+tft28', 'Pico + 2.8 in screen', 'Your build. Cheapest way into handhelds. Adds both.'],
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
    ['face', 'Character Base (Holds Chip & Battery)', 'The round base a character stands on. The chip and the battery go inside it; the character you build in Parts stands on top', 'slate'],
    ['camera', 'Camera', 'Stands upright on its thin edge. Lens and sensors in the front plate, which snaps on. Optional tripod mount underneath', 'slate'],
    ['mini', 'Mini Sensor', 'A small upright box for a tiny camera, scanner or sensor, with a snap-on front plate', 'slate'],
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
  // Try room: sound packs the sandbox plays with Web Audio (made in the browser, nothing to download). [id, name, kind]
  // kind: drum | noise | tone | fx. The Pico plays the same idea from a 16-bit, 22 kHz, mono .wav per pad.
  C.SOUND_PACKS = {
    drums808: { name: '808 Drums', sounds: [['kick', 'Kick'], ['snare', 'Snare'], ['hat', 'Hi-hat'], ['clap', 'Clap'], ['tom', 'Tom'], ['ohat', 'Open hat'], ['rim', 'Rim'], ['cow', 'Cowbell']] },
    nature: { name: 'Nature & Ambient', sounds: [['rain', 'Rain'], ['ocean', 'Ocean'], ['wind', 'Wind'], ['bird', 'Bird chirp'], ['thunder', 'Thunder'], ['stream', 'Stream'], ['cricket', 'Crickets'], ['drip', 'Drip']] },
    synth: { name: 'Synth & Bass', sounds: [['bassC', 'Bass C'], ['bassF', 'Bass F'], ['bassG', 'Bass G'], ['leadC', 'Lead C'], ['leadE', 'Lead E'], ['leadG', 'Lead G'], ['pluck', 'Pluck'], ['pad', 'Pad chord']] },
    djfx: { name: 'DJ FX Loop', sounds: [['fx:loop', 'Loop'], ['fx:echo', 'Echo'], ['fx:spiral', 'Spiral'], ['fx:phaser', 'Phaser'], ['horn', 'Air horn'], ['riser', 'Riser'], ['scratch', 'Scratch'], ['laser', 'Laser']] }
  };
  // Try room presets: what the pads and knobs do, and what Make this my build turns them into. fn = the Brain program.
  // pad: the button part, knob: the knob part, brain: the right microcontroller for the job.
  C.TRY_PRESETS = [
    { id: 'djfx', name: 'DJ FX', fn: 'djfx', pack: 'djfx', pads: 8, knobs: ['beat', 'wet'], screen: true, speaker: true, pad: 'arcade24', knob: 'pot', brain: 'pico', style: 'groove', line: 'A beat loop through Echo, Phaser and Spiral. Beat sets the echo time, Wet/Dry the mix.' },
    { id: 'drums', name: 'Drums & Nature', fn: 'sound', pads: 8, sounds: ['drums808.kick', 'drums808.snare', 'drums808.hat', 'drums808.clap', 'nature.rain', 'nature.ocean', 'nature.wind', 'nature.bird'], knobs: ['volume', 'pitch'], speaker: true, pad: 'arcade24', knob: 'pot', brain: 'pico', style: 'groove', line: '808 drums on the top row, rain, ocean, wind and birds below.' },
    { id: 'synth', name: 'Mini Synth', fn: 'synth', pack: 'synth', pads: 8, knobs: ['cutoff', 'volume'], screen: true, speaker: true, pad: 'tact12', knob: 'pot', brain: 'pico', style: 'groove', line: 'Bass, lead and pad sounds. Cutoff makes it darker or brighter.' },
    { id: 'sampler', name: 'Voice Sampler', fn: 'sound', pads: 8, sounds: ['synth.pluck', 'drums808.clap', 'nature.bird', 'djfx.horn', 'drums808.kick', 'drums808.snare', 'synth.pad', 'djfx.laser'], knobs: ['pitch', 'effect'], screen: true, speaker: true, pad: 'arcade24', knob: 'pot', brain: 'pico2', style: 'groove', line: 'Upload your own .wav or .mp3 per pad. Pitch and Effect (echo) change it live.' },
    { id: 'macro', name: 'Macro Pad', fn: 'macro', pads: 6, macros: ['Copy', 'Paste', 'Undo', 'Play/Pause', 'Mute', 'Screenshot'], knobs: ['volume'], pad: 'button16', knob: 'encoder', brain: 'pico', style: 'slate', line: 'Each button types a shortcut on your computer over USB. The wheel is the volume.' },
    { id: 'timer', name: 'Timer', fn: 'timer', pads: 2, timer: true, knobs: ['minutes'], screen: true, speaker: true, pad: 'button16', knob: 'encoder', brain: 'pico', style: 'slate', line: 'Set the minutes, press Start, it beeps at 00:00.' }
  ];
  C.KNOB_FNS = [['volume', 'Volume'], ['pitch', 'Pitch'], ['cutoff', 'Cutoff'], ['beat', 'Beat'], ['wet', 'Wet/Dry'], ['effect', 'Effect (echo)'], ['minutes', 'Minutes']];
  C.MACROS = ['Copy', 'Paste', 'Undo', 'Redo', 'Play/Pause', 'Mute', 'Screenshot', 'Save'];
  C.SOUND_LIBS = [['Freesound', 'https://freesound.org/', 'Huge free library, check each license'], ['99Sounds', 'https://99sounds.org/', 'Free sample packs, royalty free'], ['OpenGameArt', 'https://opengameart.org/', 'Free game sounds and loops']];
})();
