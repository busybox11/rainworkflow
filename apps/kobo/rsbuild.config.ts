import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";

class ES5RuntimeTransformPlugin {
  name = "ES5RuntimeTransformPlugin";

  private getSource(compilation: any, filename: string): string {
    const asset = compilation.getAsset?.(filename) ?? {
      source: compilation.assets[filename],
    };
    const source = asset?.source;
    return typeof source?.source === "function"
      ? String(source.source())
      : String(source?._value ?? "");
  }

  private setSource(
    compilation: any,
    filename: string,
    code: string,
    RawSource: any
  ) {
    const asset = RawSource
      ? new RawSource(code)
      : {
          source: () => code,
          size: () => Buffer.byteLength(code, "utf8"),
        };
    compilation.updateAsset?.(filename, asset) ??
      (compilation.assets[filename] = asset);
  }

  apply(compiler: any) {
    compiler.hooks.compilation.tap(this.name, (compilation: any) => {
      const RawSource = compiler.webpack?.sources?.RawSource;
      const stage =
        compiler.webpack?.Compilation?.PROCESS_ASSETS_STAGE_OPTIMIZE;

      compilation.hooks.processAssets.tapPromise(
        { name: this.name, stage },
        async () => {
          const { default: swc } = await import("@swc/core");

          for (const filename of Object.keys(compilation.assets ?? {})) {
            if (/\bruntime(\.[\w-]+)?\.js$/.test(filename)) {
              // for some obscure reason rspack's built in swc doesnt seem to fully respect the target config
              // so we need to transform the runtime js manually AGAIN

              const code = this.getSource(compilation, filename);
              const transformed = await swc.transform(code, {
                jsc: { target: "es5", externalHelpers: false },
                minify: false,
              });
              this.setSource(
                compilation,
                filename,
                transformed.code,
                RawSource
              );
            } else if (filename.includes("lib-polyfill")) {
              // a single corejs polyfill function breaks everything for some reason
              // its only purpose is to call .toString on the function passed to it in its args
              // so this is an ugly workaround to get rid of the faulty functionToString call
              // could probably be done with some specific config but this works so im fine with it

              const code = this.getSource(compilation, filename).replace(
                "return functionToString(it)",
                "return toString(it)"
              );
              this.setSource(compilation, filename, code, RawSource);
            }
          }
        }
      );
    });
  }
}

export default defineConfig({
  plugins: [
    pluginReact({
      // won't likely to change a lot over dev, lighter workload for browser
      splitChunks: { react: false },
      swcReactOptions: { runtime: "automatic" },

      // not needed for kobo
      enableProfiler: false,
      reactRefreshOptions: {
        // overlay won't work on kobo
        // plus the bundler plugin transformation workaround breaks its loading anyway
        overlay: false,
      },
    }),
  ],
  dev: {
    client: {
      // overlay doesn't seem to work on kobo browser
      /*
      nickel: (    17.276 @ 0x20b3a50 / ui.debug) "http://192.168.1.10:3000/static/js/vendors-node_modules_rsbuild_core_dist_client_overlay_js-node_modules_rspack_core_dist_cssExt-a60249.js:401: TypeError: Super expression must either be null or a function"
      */
      overlay: false,
    },
  },
  output: {
    polyfill: "usage",
    minify: {
      jsOptions: {
        ecma: 5,
        compress: { ecma: 5 } as any,
        format: { ecma: 5 } as any,
      } as any,
    },
  },
  source: {
    include: [/node_modules[\\/]/],
    exclude: [/node_modules[\\/]core-js/],
  },
  tools: {
    rspack: (config) => {
      config.optimization ??= {};
      config.optimization.runtimeChunk = { name: "runtime" };
      config.plugins.push(new ES5RuntimeTransformPlugin());
    },
    swc: (config) => {
      Object.assign((config.jsc ??= {}), {
        externalHelpers: false,
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
          react: { runtime: "automatic" },
        },
      });
    },
    bundlerChain: (chain, { CHAIN_ID }) => {
      chain.optimization.runtimeChunk({ name: "runtime" });
      chain.output.set("environment", {
        arrowFunction: false,
        const: false,
        destructuring: false,
        templateLiteral: false,
      });
      chain.module
        .rule(CHAIN_ID.RULE.JS)
        .after(CHAIN_ID.USE.SWC)
        .use(CHAIN_ID.USE.SWC);
    },
  },
});
