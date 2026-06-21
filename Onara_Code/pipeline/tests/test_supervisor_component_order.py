import unittest

from onara_pipeline.agents.contracts import CodegenOutput
from onara_pipeline.agents.supervisor import (
    SupervisorValidationError,
    _validate_core_component_integrity,
)


def codegen_output(body: str, css: str = "") -> CodegenOutput:
    fixture_padding = "Structural validator regression fixture. " * 12
    html = f"""<!doctype html>
<html lang="en">
  <head>
    <style>{css}</style>
  </head>
  <body>
    <!-- {fixture_padding} -->
    {body}
  </body>
</html>"""
    return CodegenOutput(
        component_files={"index.html": html},
        html=html,
        model="test",
        provider="test",
        raw_output=html,
    )


class SupervisorComponentOrderTests(unittest.TestCase):
    def test_ignores_component_references_inside_css(self) -> None:
        output = codegen_output(
            """
            <div class="site-shell">
              <header data-component="site_header">Header</header>
              <section data-component="hero">Hero</section>
            </div>
            """,
            """
            [data-component="hero"] { display: grid; }
            [data-component="site_header"] { display: flex; }
            """,
        )

        _validate_core_component_integrity(output)

    def test_accepts_spacing_and_single_quotes_in_component_attributes(self) -> None:
        output = codegen_output(
            """
            <header data-component = 'site-header'>Header</header>
            <section data-component = 'hero'>Hero</section>
            """,
        )

        _validate_core_component_integrity(output)

    def test_rejects_actual_hero_before_header_in_body(self) -> None:
        output = codegen_output(
            """
            <section data-component="hero">Hero</section>
            <header data-component="site_header">Header</header>
            """,
        )

        with self.assertRaisesRegex(
            SupervisorValidationError,
            "site header before the hero",
        ):
            _validate_core_component_integrity(output)


if __name__ == "__main__":
    unittest.main()
