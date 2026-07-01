export default {
  async scheduled(controller, env, ctx) {
    try {
      // 1. Call your API to get the number
      const apiResponse = await fetch("https://water.usace.army.mil/cda/reporting/providers/swt/locations/huds");
      if (!apiResponse.ok) {
        throw new Error(`API error: ${apiResponse.errorData}`);
      }
      
      const data = await apiResponse.json();
      const elevationLevel = data[0].timeseries.find(item => item.label === 'Elevation')?.latest_value ?? "Elevation not found";
      const THRESHOLD = 50;

      // 2. Check if the number is above your threshold
      if (elevationLevel > THRESHOLD) {
        console.log(`Value ${elevationLevel} is above threshold.`);
        
        // 3. Send email
        try {
        const response = await fetch('https://resend.com', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'onboarding@resend.dev',
            to: 'env.EMAIL', // email
            subject: 'Alert!',          // Keep subject short or empty
            text: 'Criteria met! The elevation too high!' // Keep text under 160 characters
          })
        });

        // 1. Check if the server returned a failure code (anything outside 200-299)
        if (!response.ok) {
          // 2. Parse the specific error message sent by Resend
          //const errorData = await response.json();
          
          /*
          // 3. CRITICAL: Log this so it shows up in your cloud provider's console logs
          console.error('Resend API Failed:', {
            status: response.status,
            statusText: response.statusText,
            details: errorData
          });
*/
        // Read as text instead of .json() to catch the HTML string
          const errorText = await response.text(); 
          console.log("Actual Server Error Response:", errorText);
          throw new Error(`Server dropped HTML: ${errorText}`)

          // 4. Return the specific error back to your frontend
          return {
            statusCode: response.status,
            body: JSON.stringify({ error: errorData.message || 'Failed to send email' })
          };
        }

        // Success path
        /*
          const successData = await response.json();
          console.log(successData);
          return {
            statusCode: 200,
            body: JSON.stringify({ success: true, id: successData.id })
          };
*/
        } catch (networkError) {
          // This ONLY triggers if the internet dropped or the Resend servers are completely down
          console.error('Fatal Network Error:', networkError);
          return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Could not connect to the email server' })
          };
        }
        //This will log if nothing needs to be sent, but the api call succeeded.
      } else {
        console.log(`Value ${elevationLevel} is below threshold. No email sent.`);
      }
      //Triggers if the cron job or api call failed? Not sure which.
    } catch (error) {
      console.error("Error running daily job:", error.message);
    }
  }
};
