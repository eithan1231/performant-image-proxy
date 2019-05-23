# performant-image-proxy
This is a simple, yet performant, HTTP based Image proxy. This would be ideal for public forums where users can post pictures. Implementing this will prevent IP leaks amung other things.
</br></br></br>


# Installation
We should note that this image proxy was not intended to be used as a frontend, and we would highly advise you use a reverse proxy such as Nginx. Using a reverse proxy such as Nginx will also allow for SSL/TLS, which we do not support.
</br></br>

## Process Arguments
We currently only have three arguments which we can use to configure the launch of the application. They are:
</br>
`--port {port}` - (Default: 80) The port which the HTTP server will listen on.
</br>
`--id {identifer}` - (Default: 1) An identifier for the application instance. Useful for clusters
</br>
`development` - Runs development config
</br></br>

## Configuration structures
</br>
We have taken a unique approach to designing configuration files. Per config file, there is a development and production area. This is so we can toggle a development mode with ease, and then switch back to a production area. Running development configuration can be found in the Process Arguments section.
</br></br>
All configurations are stored in YAML format. If you're umfamiliar with YAML, google `yaml format` and get a basic understanding.
</br></br>

## config/cache.yaml configuration
</br>
The configuration file located `config/cache.yaml` manages the caching system. Currently, the caching system only consists of a filesystem storage caching system. This is a simple, yet performant way to storing cache.
</br></br>
At the time I'm writing this, the configurable variable for the caching system, is the duration that cache is considered value. This value is called `duration`, and it is stored in seconds. If you set this to `1`, it will make all cached assets valid for one second. Though technically they will not be removed until the cache cleanup script has been run.
</br></br>
Cached files can be found at `cache/` directory.
</br></br>

## config/proxy.yaml
</br>
This is the primary configuration file that we strongly advise you to configure. It stores things related to the proxy web requests.
</br></br>

### User Agent
</br>
`userAgent` - (string) Is the 'key' that the useragent string is stored uder. This changes the user agent that you use to requeest to remote servers.
</br></br>

### Direct connection redirect
</br>
`redirectOnDirectAccess` - (boolean) If user directly connects to an iamge (not embeded in a page, he opens image in new tab), and this is true, it will redirect him to the image rather than loading it through the proxy. This will also stop other sites from using your proxy to load images. If this is true, you will be required to configue `refererHostnames`.
</br></br>

### Referer Hostnames
</br>
`refererHostnames` - (array) A list of referrer hostnames that can make use of the proxy. If this is misconfigured, your sever will not be able to use proxy.
</br></br>

### Trusted MIME Types
</br>
`trustedContentTypes` - (array) Array of trusted MIME types. We advise you to leave this as the default, as configuring it may result in images load being proxied.
</br></br>

## Route to proxy image
</br>
`/proxy?{url}` where `{url}` is the image you want to proxy.
</br></br>
Example: `/proxy?https://google.com/favicon.ico`
</br></br>
