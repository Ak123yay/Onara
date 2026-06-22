import unittest

from onara_pipeline.agents.agent_06_codegen import extract_index_html
from onara_pipeline.agents.contracts import CodegenOutput
from onara_pipeline.agents.supervisor import (
    SupervisorValidationError,
    _unsafe_keyframe_properties,
    repair_codegen_motion,
    validate_codegen_output,
)


def complete_html(css: str) -> str:
    padding = "Complete contractor website content. " * 50
    return f"""<!doctype html>
<html lang="en">
<head><style>{css}</style></head>
<body>
  <header data-component="site_header">Header</header>
  <main>
    <section data-component="hero"><a href="#contact">Get estimate</a>{padding}</section>
    <section data-component="contact" id="contact">Contact</section>
  </main>
</body>
</html>"""


def output_for(html: str) -> CodegenOutput:
    return CodegenOutput(
        component_files={"index.html": html},
        fallback_used=False,
        html=html,
        model="test",
        provider="test",
        raw_output=html,
    )


class CodegenRecoveryTests(unittest.TestCase):
    def test_extracts_complete_unmarked_document(self) -> None:
        html = complete_html("@keyframes rise { from { opacity: 0; transform: translateY(8px); } }")
        self.assertEqual(extract_index_html(f"Here is index.html:\n{html}\n"), html)

    def test_injects_safe_motion_when_model_omits_it(self) -> None:
        repaired = repair_codegen_motion(complete_html("body { color: #111; }"))
        self.assertIn("@keyframes onara-enter", repaired)
        self.assertIn("prefers-reduced-motion", repaired)
        self.assertEqual(_unsafe_keyframe_properties(repaired), [])

    def test_removes_layout_shifting_keyframe_properties(self) -> None:
        html = complete_html(
            """
            @keyframes grow {
              from {
                width: 0;
                opacity: 0;
              }
              to {
                width: 100%;
                opacity: 1;
              }
            }
            """
        )
        repaired = repair_codegen_motion(html)
        self.assertNotIn("width: 0", repaired)
        self.assertNotIn("width: 100%", repaired)
        self.assertIn("transform", repaired)
        self.assertEqual(_unsafe_keyframe_properties(repaired), [])

    def test_validator_rejects_unrepaired_width_animation(self) -> None:
        html = complete_html(
            """
            @keyframes grow {
              from { width: 0; opacity: 0; transform: translateY(4px); }
              to { width: 100%; opacity: 1; transform: translateY(0); }
            }
            @media (prefers-reduced-motion: reduce) {
              * { animation: none !important; }
            }
            """
        )
        with self.assertRaisesRegex(SupervisorValidationError, "must not animate width"):
            validate_codegen_output(output_for(html), allow_repairable_visual_issues=True)


if __name__ == "__main__":
    unittest.main()
