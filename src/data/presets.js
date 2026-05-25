export const presets = [
  {
    id: "run-out",
    title: "Appeal #1: Run Out (Close Call)",
    type: "Run Out",
    batsman: "R. Sharma",
    bowler: "J. Bumrah",
    totalFrames: 60,
    bailOffFrame: 44,
    batCrossFrame: 46,
    soundSpikeFrame: -1, // No sound spike for run-outs
    description: "A quick throw from short mid-wicket to the keeper. The batsman dives to make his crease.",
    ruling: "OUT",
    explanation: "At frame 44, the bails are fully dislodged from the stumps. The batsman's bat is measured to be 1.8cm short of the popping crease line (calibrated at X=420px). The bat subsequently crosses the line at frame 46. Decision: OUT.",
    // Coordinates for drawing simulation
    frames: Array.from({ length: 61 }, (_, i) => {
      // Batsman sliding bat from left to right (X coordinate)
      // Wicket is at X = 450. Crease is at X = 420.
      // Batsman starts at X = 150, reaches X = 420 at frame 46.
      const batX = 150 + (i * 6); 
      // Ball thrown from right (X=700, Y=100) to wicketkeeper (X=460, Y=250)
      // Ball arrives at wicket at frame 43
      let ballX = 700;
      let ballY = 100;
      if (i < 43) {
        ballX = 700 - (i * (240 / 43));
        ballY = 100 + (i * (150 / 43));
      } else {
        ballX = 460;
        ballY = 250;
      }
      
      return {
        frame: i,
        batX,
        batY: 250,
        ballX,
        ballY,
        bailsOn: i < 44,
        keeperActive: i >= 42,
        distanceToCrease: Math.max(0, (420 - batX) * 0.15) // convert to cm
      };
    })
  },
  {
    id: "stumping",
    title: "Appeal #2: Stumping (Spin Appeal)",
    type: "Stumping",
    batsman: "V. Kohli",
    bowler: "R. Jadeja",
    totalFrames: 60,
    bailOffFrame: 42,
    batCrossFrame: 48,
    soundSpikeFrame: -1,
    description: "The batsman steps down the track to a turning delivery, misses, and the wicketkeeper whips the bails off in a flash.",
    ruling: "OUT",
    explanation: "The wicketkeeper dislodges the bails at frame 42. Frame-by-frame analysis confirms the batsman's back foot was completely in the air, with no part of his foot or bat grounded behind the popping crease. The foot lands back inside the crease at frame 48. Decision: OUT.",
    frames: Array.from({ length: 61 }, (_, i) => {
      // Batsman steps out (X=460), then attempts to drag foot back (crease is X=420)
      let footX = 420;
      let footY = 250;
      let footGrounded = true;

      if (i < 30) {
        footX = 420; // safe
      } else if (i >= 30 && i < 48) {
        // batsman has stepped out to X = 470
        footX = 470 - ((i - 30) * (50 / 18));
        // foot is in the air between 35 and 47
        if (i >= 35 && i < 48) {
          footY = 250 - Math.sin(((i - 35) / 12) * Math.PI) * 15;
          footGrounded = false;
        }
      } else {
        footX = 420;
        footY = 250;
      }

      // Ball path
      let ballX = 150 + (i * 8);
      let ballY = 180 + Math.sin(i * 0.1) * 30;
      if (i > 38) {
        // ball goes to keeper (X=460)
        ballX = 460;
        ballY = 250;
      }

      return {
        frame: i,
        footX,
        footY,
        footGrounded,
        ballX,
        ballY,
        bailsOn: i < 42,
        keeperActive: i >= 40,
        distanceToCrease: footX > 420 ? (footX - 420) * 0.15 : 0
      };
    })
  },
  {
    id: "caught-behind",
    title: "Appeal #3: Caught Behind (UltraEdge/Snicko)",
    type: "Caught Behind",
    batsman: "S. Gill",
    bowler: "M. Shami",
    totalFrames: 60,
    bailOffFrame: -1,
    batCrossFrame: -1,
    soundSpikeFrame: 32, // Spike exactly when ball is next to bat at frame 32
    description: "A fast, rising delivery passing close to the outside edge of the bat. Sound feed shows a clear spike.",
    ruling: "OUT",
    explanation: "At frame 32, the ball is directly adjacent to the edge of the bat. Simultaneously, the UltraEdge sound feed detects a high-frequency spike (2.4 kHz), indicating clear contact. There is no contact with the ground or pad at this frame. Decision: OUT.",
    frames: Array.from({ length: 61 }, (_, i) => {
      // Ball flies past the bat (bat is static at X=400, Y=220)
      const ballX = 100 + (i * 9);
      const ballY = 250 - (i * 1); // straight trajectory
      
      // Calculate distance between ball and bat
      // Bat is at X=400, Y=220. Ball passes bat at frame 33 (X=397, Y=217)
      const distanceToBat = Math.sqrt(Math.pow(ballX - 400, 2) + Math.pow(ballY - 220, 2));

      return {
        frame: i,
        ballX,
        ballY,
        batX: 400,
        batY: 220,
        distanceToBat,
        // Sound waveform generator
        soundAmplitude: i === 32 ? 0.95 : i === 31 || i === 33 ? 0.4 : 0.05 + Math.sin(i * 1.5) * 0.02
      };
    })
  }
];
