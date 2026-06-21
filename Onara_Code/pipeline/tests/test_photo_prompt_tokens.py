import unittest

from onara_pipeline.agents.context import (
    build_business_context,
    materialize_photo_tokens,
    photo_assets_for_prompt,
    tokenize_photo_sources,
)


class PhotoPromptTokenTests(unittest.TestCase):
    def test_data_image_is_tokenized_for_ai_prompts_and_restored_after_codegen(self) -> None:
        data_uri = "data:image/png;base64," + ("abc123" * 1000)
        context = build_business_context(
            {
                "name": "Example Plumbing",
                "resolved_photos": [{"alt": "Service van", "src": data_uri}],
            },
            {},
        )

        assets = photo_assets_for_prompt(context)

        self.assertEqual(assets[0]["src"], "{{ONARA_PHOTO_1}}")
        self.assertNotIn(data_uri, str(assets))
        self.assertEqual(
            materialize_photo_tokens('<img src="{{ONARA_PHOTO_1}}" alt="Service van">', context),
            f'<img src="{data_uri}" alt="Service van">',
        )

    def test_https_photo_url_remains_unchanged(self) -> None:
        photo_url = "https://images.example.com/service-van.jpg"
        context = build_business_context(
            {
                "name": "Example Plumbing",
                "resolved_photos": [{"alt": "Service van", "src": photo_url}],
            },
            {},
        )

        self.assertEqual(photo_assets_for_prompt(context)[0]["src"], photo_url)

    def test_repair_prompt_tokenizes_embedded_data_images(self) -> None:
        data_uri = "data:image/jpeg;base64," + ("xyz789" * 1000)
        context = build_business_context(
            {
                "name": "Example Plumbing",
                "resolved_photos": [{"alt": "Technician", "src": data_uri}],
            },
            {},
        )

        tokenized = tokenize_photo_sources(f'<img src="{data_uri}">', context)

        self.assertEqual(tokenized, '<img src="{{ONARA_PHOTO_1}}">')


if __name__ == "__main__":
    unittest.main()
