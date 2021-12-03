To Run:
```
npm install
npm run-script watch
```
**StreamVerse = Streaming + Metaverse**

An Ecosystem for streamers to monetize their streams and moments without any third party arbitration providing inter-player interaction as base layer.
 
Pitch Deck : [Google Slides Link](https://docs.google.com/presentation/d/1YsqIbZb-f8kVPSyfS2Nyvbe8U00J6FkJzkLwEQwWYIc/edit?usp=sharing)

## Brainstorm 🧠

We all have used streaming platforms and the one thing they lack is interactivity and are far away from being realistic. We wanted to build something that will capture the attention of Gen-Z while also maintaining the ease of usage. To make the streaming more realistic we need a realistic space and emotions. Any breathtaking moment can be converted to NFT and it will live forever. Stream for your fans without relying on any centralized entity.

- Easier to maintain eye-contact 
- Feel more lively 
- Talk with other fans
- More than one Group inside a Single Room
- Better ways to monetize streams

## UseCases 🍍

**Charity Events:**
You can host your charity event with a few clicks and the volunteers will be able to directly interact with potential donors solving there query in realtime it is like a virtual office donors can come watch streams about the work your foundation does and if they have any query they can directly interact with volunteers. They also get a NFT for donating. Charity Auction for NFT’s via SmartContracts but this auction will be more lively and will take only seconds to setup.
![Charity Usecase](https://streamverse.b-cdn.net/Blank_diagram7.png)

**Esports Event :**
As Esports events are getting more mainstream and their audience is perfect fit for the metaverse experience and radical shift from web2 to web3 this is another scenario where Streamverse can enter. The event host can set up rooms for every team where their supporters can watch the stream of every player as well as cheer together. Streamers can mint their Video NFT’s in an instant there Fans can buy them from the metaverse.

## Infrastructure 🏗

![Infrastructure Image](https://streamverse.b-cdn.net/StreamVerse.png)

We are build to be resilient. Our infrastructure is designed very carefully keeping in mind the amount of effort and time users from all around the world will spend on our platform. We are totally decentralized from streaming to gifting.

**Theta Edge Cast :** Decentralized Streaming technology for the best quality of service and seamless streaming experience. Streamers run their own Theta Edge Node which makes them independent and entry barrier decreases which makes the onboarding process easy. Viewers onboarding also becomes easy as users directly connect to our Theta Edge Node.

**Theta Video API :** All the video NFT’s are uploaded to Theta Video API for fast content delivery. Hybrid Support of P2P and CDN technology which makes it cost-efficient. Encoding feature of the Theta Video API  provides multi-resolution which allows both low bandwith/resolution users as well as high bandwith/resolution users to access the videos  .

**Theta Smart Contract :** All the events are minted as tokens and provided to the host to allow special access to the host and create token-gated spaces. NFT’s follow TNT-721 standards and can be minted by the content-creators. Logic for royalty is also provided.

**Theta P2P JS SDK:** Along with our self-hosted Edge node we are playing the videos using Theta’s P2P JS SDK.

**Graph Node :** We are running our own self-hosted graph node to index the data for faster access. All the events from the smart contracts are recorded to the graphnode providing the API’s for Front-end Developer.

**WebRTC:** For Facetime Video/Audio we are using webrtc to make our infrastructure decentralized
BablyonJS : For creating the 3D environment. Using websockets to provide coordinates for player movements.  

## What it does 🔧

A Decentralized Live Streaming platform utilizing Theta’s peer-to-peer edge network for video streaming. Built-in NFT support and a 3D virtual experience with audio and video interaction support.

- Host Charity/Esports/Friendly Events
- Decentralized Streaming 
- Mint NFT’s of special moments 
- Spatial Audio to improve the experience 
- A better way to monetize streamers
- Video on Character for realistic feel


## Challenges we ran into 💪

Instead of Using Game-Engines which do not support web-browsers natively we have used BablyonJs for the best possible user Experience

Integrating Theta EdgeCast with our Metaverse. To watch the stream broadcasted by streamers via Theta Edge Node (EdgeCast) on our metaverse on viewers side via running local Theta Edge node we were getting CORS error.(To Solve Our CORS problem we hosted our own Self-Hosted Theta Edge Node)

## Accomplishments that we're proud of 😎
- Integrating spatial audio to improve the feel 
- To Solve Our CORS problem we hosted our own Self-Hosted EdgeCast Node. Along with our self-hosted Edge node we are playing the videos using Theta’s P2P JS SDK
- Adding video texture to the character’s face 

## What's next for StreamVerse⏱
There’s a lot to build and lot to learn. We want to work on growing the project organically. Building various different spaces with dynamic screens. We also want to work on a solution to create a scalable theta edge node solution to make our project more scalable

**Try Out Demo Event:**
[https://streamverse.overclockedbrains.co/?meeting_id=ZsSQg9cH_0&t=U3RyZWFtdmVyc2UgRXZlbnQ=](https://streamverse.overclockedbrains.co/?meeting_id=ZsSQg9cH_0&t=U3RyZWFtdmVyc2UgRXZlbnQ=)

**Host Your Own Event:**
[https://streamverse.overclockedbrains.co/](https://streamverse.overclockedbrains.co/)
