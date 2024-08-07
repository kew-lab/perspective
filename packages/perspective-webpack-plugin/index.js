// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

const path = require("path");
const webpack = require("webpack");

class PerspectiveWebpackPlugin {
    constructor(options = {}) {
        this.options = Object.assign(
            {},
            {
                inline: false,
                inlineWasm: false,
                inlineWorker: false,
                wasmPath: path.dirname(
                    require.resolve("@finos/perspective/package.json")
                ),
                viewerPath: path.dirname(
                    require.resolve("@finos/perspective-viewer/package.json")
                ),
                workerPath: path.dirname(
                    require.resolve("@finos/perspective/package.json")
                ),
                wasmName: "[name].wasm",
                workerName: "[name].js",
            },
            options
        );
    }

    apply(compiler) {
        const compilerOptions = compiler.options;
        const moduleOptions =
            compilerOptions.module || (compilerOptions.module = {});
        const rules = [];

        // Emscripten outputs require statements for these which are not called
        // when loaded in browser.  It's not polite to delete these but ...
        const resolveOptions =
            compilerOptions.resolve || (compilerOptions.resolve = {});
        const fallbackOptions =
            resolveOptions.fallback || (resolveOptions.fallback = {});

        fallbackOptions.path = false;
        fallbackOptions.fs = false;

        if (this.options.inline || this.options.inlineWorker) {
            rules[rules.length - 1].use.options.inline = "no-fallback";
        }

        if (!(this.options.inline || this.options.inlineWasm)) {
            rules.push({
                test: /\.wasm$/,
                include: [this.options.wasmPath, this.options.viewerPath],
                type: "asset/resource",
            });
        } else {
            rules.push({
                test: /\.wasm$/,
                type: "javascript/auto",
                include: [this.options.wasmPath, this.options.viewerPath],
                loader: require.resolve("arraybuffer-loader"),
            });
        }

        const plugin_replace = new webpack.NormalModuleReplacementPlugin(
            /@finos\/perspective$/,
            "@finos/perspective/dist/cdn/perspective.js"
        );
        plugin_replace.apply(compiler);

        const plugin_replace2 = new webpack.NormalModuleReplacementPlugin(
            /@finos\/perspective\-viewer$/,
            "@finos/perspective-viewer/dist/cdn/perspective-viewer.js"
        );
        plugin_replace2.apply(compiler);

        const plugin_replace3 = new webpack.NormalModuleReplacementPlugin(
            /@finos\/perspective\-workspace$/,
            "@finos/perspective-workspace/dist/cdn/perspective-workspace.js"
        );
        plugin_replace3.apply(compiler);
        // moduleOptions.parser = { javascript: { importMeta: false } };

        moduleOptions.rules = (moduleOptions.rules || []).concat(rules);
    }
}

module.exports = PerspectiveWebpackPlugin;
