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
        
        // 3. Send email via MailChannels API
        const sendEmailURL = 'https://api.mailchannels.net/tx/v1/send';
    
        const emailData = {
          personalizations: [
            {
              to: [{ email: "mcoulson33@gmail.com", name: "Matt" }]
            }
          ],
          from: {
            email: "mcoulson33@gmail.com",
            name: "Matt"
          },
          subject: "Test Email from Worker",
          content: [
            {
              type: "text/plain",
              value: "This is a low-volume transactional email."
            }
          ]
        };
    
        const emailResponse = await fetch(sendEmailURL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Crucial fix: Attach your brand new authenticated MailChannels API Key
            'X-Api-Key': 'env.MAILCHANNELS_API_KEY' 
          },
          body: JSON.stringify(emailData)
        });
    
        return new Response(await response.text(), { status: response.status });
      }
        /*
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
*/
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
