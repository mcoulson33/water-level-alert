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
        
        // 3. Send email via MailChannels API (No domain or API keys required)
        const emailResponse = await fetch("https://mailchannels.net", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            personalizations: [
              {
                to: [{ email: "mcoulson33@gmail.com", name: "Me" }],
              },
            ],
            from: {
              email: "alerts@worker.local",
              name: "Daily Threshold Bot",
            },
            subject: `Alert: Threshold Exceeded (${generatedNumber})`,
            content: [
              {
                type: "text/plain",
                value: `Alert! The generated number has reached ${generatedNumber}, which is above the threshold of ${THRESHOLD}.`,
              },
            ],
          }),
        });

        if (emailResponse.ok) {
          console.log("Alert email sent successfully.");
        } else {
          const errText = await emailResponse.text();
          console.error(`MailChannels failed to send: ${errText}`);
        }
      } else {
        console.log(`Value ${generatedNumber} is below threshold. No email sent.`);
      }

    } catch (error) {
      console.error("Error running daily job:", error);
    }
  }
};
