# Gametests

Features
- Typescript support and bundling through [esbuild](https://esbuild.github.io/)
- Manages manifest script dependencies
- Manages manifest module

This filter manages script-related manifest settings and allows separation of scripts from the main pack.

Utilizing the separation ability allows you to keep unit tests and such separate from your main pack. This can be used by having one profile setup for QA/development which uses this filter to add the unit tests to the pack and have another profile which does not include this filter.
