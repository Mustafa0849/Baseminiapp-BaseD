export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL || "https://baseminiapp-base-d-app.vercel.app";
  
  const manifest = {
    accountAssociation: {
      header: "", // Will be filled in Step 5 after generating credentials
      payload: "",
      signature: ""
    },
    miniapp: {
      version: "1",
      name: "BaseD",
      homeUrl: appUrl,
      iconUrl: `${appUrl}/icon.png`,
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#000000",
      webhookUrl: "", // Optional: Add webhook URL if needed
      subtitle: "Your On-Chain Reputation & Credit Protocol",
      description: "BaseD: A DeFi lending protocol with credit scoring on Base. Build your on-chain reputation and access tiered lending limits.",
      screenshotUrls: [
        `${appUrl}/screenshot1.png`,
        // Add more screenshots as needed (max 5)
      ],
      primaryCategory: "defi",
      tags: ["defi", "lending", "credit", "based", "base", "reputation"],
      heroImageUrl: `${appUrl}/hero.png`,
      tagline: "Your On-Chain Reputation & Credit Protocol",
      ogTitle: "BaseD - Lending Protocol",
      ogDescription: "BaseD: Your On-Chain Reputation & Credit Protocol on Base",
      ogImageUrl: `${appUrl}/og.png`,
      noindex: false // Set to false for production
    }
  };

  return Response.json(manifest, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

