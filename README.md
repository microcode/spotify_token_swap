This is an example token swap service written in Node.JS. This is required by the Spotify iOS SDK to authenticate a user.

See the [Spotify iOS SDK](https://developer.spotify.com/technologies/spotify-ios-sdk/) for details about the SDK and the role the token swap service has in your iOS application.

*IMPORTANT*: The example credentials will work for the example apps, you should use your own in your real environment. as these might change at any time.

Using the token swap service in your iOS code
=============================================

Once the service is running, pass the public URI to it (e.g. http://localhost:1234/swap) to the token swap method in the SDK.

    NSURL *swapServiceURL =
       [NSURL # urlWithString:@"http://localhost:1234/swap"];

    -[SPAuth handleAuthCallbackWithTriggeredAuthURL:url
           tokenSwapServiceEndpointAtURL:swapServiceURL callback:callback];

