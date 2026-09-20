# webpninja-sdk

Official Java/Android client for the [WebP Ninja](https://webpninja.com) Developer API — server-side
image compression for WebP, JPEG, PNG, and AVIF.

One artifact works on both the JVM and Android — it's a plain JAR with no Android-specific build
step needed, built on [OkHttp](https://square.github.io/okhttp/) (the same HTTP client most
Android apps already use) instead of `java.net.http`, which Android doesn't support.

## Install

Maven (`pom.xml`):

```xml
<dependency>
  <groupId>com.webpninja</groupId>
  <artifactId>webpninja-sdk</artifactId>
  <version>1.0.0</version>
</dependency>
```

Gradle (`build.gradle`, works the same in an Android app module):

```groovy
implementation 'com.webpninja:webpninja-sdk:1.0.0'
```

## Usage

```java
import com.webpninja.sdk.WebPNinja;

WebPNinja client = new WebPNinja("webpninja_live_your_key");
// or: WebPNinja client = new WebPNinja(); // reads WEBPNINJA_API_KEY

client.compressToFile(new File("photo.png"), new File("photo.webp"), "webp", 75);
```

Or get the compressed bytes directly:

```java
byte[] data = client.compress(new File("photo.png"), "webp", 75);
```

`compress`/`compressToFile` also accept raw `byte[]` input via an overload that takes a filename.

## Error handling

```java
import com.webpninja.sdk.RateLimitError;
import com.webpninja.sdk.AuthenticationError;

try {
    client.compress(new File("photo.png"), "webp");
} catch (RateLimitError e) {
    System.out.println("Quota: " + e.getUsed() + "/" + e.getQuota());
} catch (AuthenticationError e) {
    System.out.println("Check your API key.");
}
```

All errors extend `WebPNinjaError` and carry `getStatus()` (the HTTP status code) and `getMessage()`.
See [webpninja.com/docs](https://webpninja.com/docs) for the full error reference.

## License

MIT
