"""
Complete Pipeline Orchestrator
Runs all 5 phases sequentially
"""
import logging
import asyncio
from pathlib import Path
from typing import Dict, Any, List
import json

# Import all processors
from .premiere.xml_generator import export_clips_to_premiere
from .matrix.canvas_renderer import render_all_styles
from .matrix.face_tracker import FaceTracker
from .variations.temporal_generator import create_variations_for_clip
from .ai.title_generator import TitleGenerator, CaptionFormatter

logger = logging.getLogger(__name__)


class ClipFactoryOrchestrator:
    """
    Orchestrates the complete clip factory pipeline.

    Phases:
    1. Council Deliberation (import from existing adlab)
    2. Premiere Integration (XML export + re-upload)
    3. Matrix Processing (face tracking + canvas)
    4. Variation Generation (temporal + music + captions)
    5. Distribution (posting helper)
    """

    def __init__(self, config: Dict[str, Any]):
        """
        Initialize orchestrator with configuration.

        Args:
            config: Configuration dictionary
        """
        self.config = config
        self.title_generator = TitleGenerator(
            anthropic_key=config.get('anthropic_api_key'),
            openai_key=config.get('openai_api_key')
        )
        self.caption_formatter = CaptionFormatter()
        self.face_tracker = FaceTracker()

    async def run_complete_pipeline(
        self,
        video_path: str,
        output_dir: str
    ) -> Dict[str, Any]:
        """
        Run the complete pipeline from video upload to distribution.

        Args:
            video_path: Path to uploaded video
            output_dir: Output directory for all files

        Returns:
            Dict with pipeline results
        """
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        results = {
            "video_path": video_path,
            "output_dir": str(output_dir),
            "phases": {}
        }

        try:
            # PHASE 1: Council Deliberation
            logger.info("Phase 1: Council Deliberation")
            clips = await self.phase1_council_deliberation(video_path)
            results["phases"]["phase1"] = {
                "status": "complete",
                "clips_found": len(clips)
            }

            # PHASE 2: Premiere Integration
            logger.info("Phase 2: Premiere Integration")
            xml_path = await self.phase2_premiere_export(
                clips,
                video_path,
                output_dir / "premiere"
            )
            results["phases"]["phase2"] = {
                "status": "complete",
                "xml_path": str(xml_path)
            }

            # Wait for Wes to edit and re-upload
            # This is a manual step - orchestrator pauses here
            logger.info("Waiting for edited clips re-upload...")

            # PHASE 3: Matrix Processing
            logger.info("Phase 3: Matrix Processing")
            processed_clips = await self.phase3_matrix_processing(
                clips,
                video_path,
                output_dir / "matrix"
            )
            results["phases"]["phase3"] = {
                "status": "complete",
                "processed_clips": len(processed_clips)
            }

            # PHASE 4: Variation Generation
            logger.info("Phase 4: Variation Generation")
            variations = await self.phase4_generate_variations(
                processed_clips,
                output_dir / "variations"
            )
            results["phases"]["phase4"] = {
                "status": "complete",
                "variations_generated": len(variations)
            }

            # PHASE 5: Distribution Setup
            logger.info("Phase 5: Distribution Setup")
            distribution = await self.phase5_distribution_setup(
                variations,
                output_dir / "distribution"
            )
            results["phases"]["phase5"] = {
                "status": "complete",
                "distribution": distribution
            }

            # Write final manifest
            manifest_path = output_dir / "pipeline_manifest.json"
            with open(manifest_path, 'w') as f:
                json.dump(results, f, indent=2)

            logger.info(f"Pipeline complete! Manifest: {manifest_path}")

            return results

        except Exception as e:
            logger.error(f"Pipeline failed: {e}")
            results["error"] = str(e)
            raise

    async def phase1_council_deliberation(
        self,
        video_path: str
    ) -> List[Dict[str, Any]]:
        """
        Phase 1: Run council deliberation.

        This would integrate with the existing adlab council system.
        For now, placeholder.
        """
        # TODO: Integrate with adlab council
        # from adlab.council import run_council

        logger.info("Running council deliberation...")

        # Placeholder: return mock clips
        return [
            {
                "clip_id": f"clip_{i:03d}",
                "start_time": i * 120.0,
                "end_time": i * 120.0 + 45.0,
                "transcript": f"Sample transcript for clip {i}",
                "hook_score": 7.5 + (i % 3)
            }
            for i in range(10)  # Mock 10 clips
        ]

    async def phase2_premiere_export(
        self,
        clips: List[Dict[str, Any]],
        source_video: str,
        output_dir: Path
    ) -> Path:
        """
        Phase 2: Export clips to Premiere XML.
        """
        output_dir.mkdir(parents=True, exist_ok=True)
        xml_path = output_dir / "clips_export.xml"

        export_clips_to_premiere(clips, source_video, str(xml_path))

        logger.info(f"Premiere XML exported: {xml_path}")
        return xml_path

    async def phase3_matrix_processing(
        self,
        clips: List[Dict[str, Any]],
        source_video: str,
        output_dir: Path
    ) -> List[Dict[str, Any]]:
        """
        Phase 3: Matrix processing - face tracking + canvas rendering.
        """
        output_dir.mkdir(parents=True, exist_ok=True)
        processed_clips = []

        for clip in clips:
            clip_id = clip["clip_id"]

            # TODO: Extract clip from source video first
            # clip_path = await self.extract_clip(source_video, clip)

            # For now, assume clip exists
            clip_path = f"/tmp/{clip_id}.mp4"  # Placeholder

            # Face tracking
            tracking_data = self.face_tracker.track_faces_in_video(clip_path)

            # Canvas rendering (3 styles)
            rendered = render_all_styles(
                clip_path,
                str(output_dir),
                clip_id
            )

            processed_clips.append({
                **clip,
                "rendered_paths": rendered,
                "tracking_data": len(tracking_data)
            })

        return processed_clips

    async def phase4_generate_variations(
        self,
        clips: List[Dict[str, Any]],
        output_dir: Path
    ) -> List[Dict[str, Any]]:
        """
        Phase 4: Generate all variations.

        For each clip:
        - Create 3 temporal variations
        - Apply 3 reframe styles
        - Generate titles
        - Generate captions
        - Apply music (selection done via UI)
        """
        output_dir.mkdir(parents=True, exist_ok=True)
        all_variations = []

        for clip in clips:
            # Get temporal variations
            variations = create_variations_for_clip(
                clip["clip_id"],
                clip["start_time"],
                clip["end_time"],
                video_duration=7200.0,  # 2 hours
                reframe_styles=['original', 'flipped', 'blurry_bg']
            )

            # Generate titles for each
            for variation in variations:
                # Generate title variants
                title_variants = await self.title_generator.generate_from_transcript(
                    clip["transcript"],
                    clip["hook_score"],
                    variation["duration"],
                    num_variants=5
                )

                # Format captions
                caption = self.caption_formatter.format_caption(
                    clip["transcript"][:50]
                )

                variation["title_variants"] = title_variants
                variation["caption"] = caption

                all_variations.append(variation)

        logger.info(f"Generated {len(all_variations)} total variations")
        return all_variations

    async def phase5_distribution_setup(
        self,
        variations: List[Dict[str, Any]],
        output_dir: Path
    ) -> Dict[str, Any]:
        """
        Phase 5: Set up distribution.

        - Organize variations by account
        - Create posting schedule
        - Generate calendar events
        """
        output_dir.mkdir(parents=True, exist_ok=True)

        distribution = {
            "total_variations": len(variations),
            "accounts": [],
            "schedule": []
        }

        # TODO: Organize by account
        # TODO: Create calendar events
        # TODO: Generate posting helper data

        return distribution


async def main():
    """Example usage."""
    config = {
        "anthropic_api_key": "sk-ant-...",
        "openai_api_key": "sk-...",
    }

    orchestrator = ClipFactoryOrchestrator(config)

    results = await orchestrator.run_complete_pipeline(
        video_path="/path/to/video.mp4",
        output_dir="./output"
    )

    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
