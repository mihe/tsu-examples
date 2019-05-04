# ![TypeScript for Unreal (Examples)][bnr]

A couple of examples showcasing [TypeScript for Unreal][tsu].

Need help with something? Join us on [Discord][dsc] or the [forums][frm].

This project is based on the Blueprint Input level in the [Content Examples][cex] project and is meant to show the difference between making something in Blueprint versus making something in TypeScript for Unreal.

## Downloads

Please note that **currently**...

- TSU is in **alpha**
- TSU has **only** been tested with **Unreal Engine 4.22**
- You can **not** use TSU outside of Win64 **editor** builds
- You can **not** use TSU in packaged/cooked builds
- There **will** be breaking changes in upcoming versions

Hopefully all of these issues will be resolved soon, but please be aware of them before downloading.

If you still want to try it, head over to [Releases][rls].

## Building

_(This only applies if you're **not** using the pre-built binaries found in [Releases][rls])._

- Make sure you have [Visual Studio][vss] installed.
- Clone this project **recursively**...
    - `git clone --recursive https://github.com/mihe/tsu-examples.git TsuExamples`
- Build from Visual Studio...
    - Generate project files from the context menu of the `.uproject` file
    - Set configuration to `Development Editor`
    - Set platform to `Win64`
    - Run `Build Solution` from the `Build` menu
- OR build from command-line...
    - `UnrealBuildTool.exe "C:\Path\To\TsuExamples.uproject" TsuExamplesEditor Win64 Development`

## License

This project is licensed under the 3-clause BSD license. See the [LICENSE][lic] file for details.

[bnr]: https://user-images.githubusercontent.com/4884246/54883366-87e36180-4e65-11e9-8bc9-5fdb6b5cd462.png
[cex]: https://docs.unrealengine.com/en-US/Resources/ContentExamples
[dsc]: https://discord.gg/QPrNpAQ
[frm]: https://forums.unrealengine.com/community/work-in-progress/1603304-typescript-for-unreal
[lic]: LICENSE.md
[rls]: https://github.com/mihe/tsu-examples/releases
[tsu]: https://github.com/mihe/tsu
[vss]: https://docs.unrealengine.com/en-us/Programming/Development/VisualStudioSetup
