export default {
  async scheduled(controller, env, ctx) {
    try {
      // 1. Call your API to get the number
      const apiResponse = await fetch("https://water.usace.army.mil/cda/reporting/providers/swt/locations/huds");
      if (!apiResponse.ok) {
        throw new Error(`API error: ${apiResponse.statusText}`);
      }
      
      const data = await apiResponse.json();
      const generatedNumber = data[0].timeseries[4].latest_value; 
      const THRESHOLD = 50;

      // 2. Check if the number is above your threshold
      if (generatedNumber > THRESHOLD) {
        console.log(`Value ${generatedNumber} is above threshold. Sending email via MailChannels...`);
        
        // 3. Send email
        async fetch(request, env, ctx) {
          try {
            // Native Cloudflare email binding request
            await env.SELVES_FORWARDER.send({
              from: "alerts@yourdomain.com",
              to: "mcoulson33@gmail.com", // Must match Step 1
              subject: `Alert: Threshold Exceeded (${generatedNumber})`,
              content: [
                {
                  type: "text/plain",
                  value: `Alert! The generated number has reached ${generatedNumber}, which is above the threshold of ${THRESHOLD}.`,
                }
              ]
            });
      
            return new Response("Notification dispatched successfully!", { status: 200 });
      
          } catch (error) {
            return new Response(`Native Email Error: ${error.message}`, { status: 500 });
          }
        }

      } else {
        console.log(`Value ${generatedNumber} is below threshold. No email sent.`);
      }

    } catch (error) {
      console.error("Error running daily job:", error);
    }
  }
};
