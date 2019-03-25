using UnrealBuildTool;

public class TsuExamplesEditorTarget : TargetRules
{
	public TsuExamplesEditorTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Editor;

		bEnforceIWYU = true;
		bShadowVariableErrors = true;
		bUndefinedIdentifierErrors = true;

		WindowsPlatform.bStrictConformanceMode = true;
	}
}
