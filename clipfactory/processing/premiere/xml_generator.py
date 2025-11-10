"""
Premiere Pro XML Generator
Exports clips to Premiere-compatible XML format
"""
from typing import List, Dict, Any
from pathlib import Path
from lxml import etree as ET
import logging

logger = logging.getLogger(__name__)


class PremiereXMLGenerator:
    """Generate Premiere Pro XML for clip import."""

    def __init__(self):
        self.timeline_fps = 60
        self.audio_sample_rate = 48000

    def generate_xml(
        self,
        clips: List[Dict[str, Any]],
        source_video_path: str,
        output_path: str
    ) -> str:
        """
        Generate Premiere Pro XML file.

        Args:
            clips: List of clip dictionaries with start/end times
            source_video_path: Path to source video file
            output_path: Where to save XML file

        Returns:
            Path to generated XML file
        """
        try:
            # Create root element
            root = ET.Element(
                "xmeml",
                version="4"
            )

            # Create sequence
            sequence = ET.SubElement(root, "sequence")
            ET.SubElement(sequence, "name").text = "ClipFactory_Sequence"
            ET.SubElement(sequence, "duration").text = str(self._frames_from_seconds(7200))  # 2 hours max

            # Rate info
            rate = ET.SubElement(sequence, "rate")
            ET.SubElement(rate, "timebase").text = str(self.timeline_fps)
            ET.SubElement(rate, "ntsc").text = "FALSE"

            # Media pool
            media = ET.SubElement(sequence, "media")

            # Video track
            video = ET.SubElement(media, "video")
            video_track = ET.SubElement(video, "track")

            # Audio track
            audio = ET.SubElement(media, "audio")
            audio_track = ET.SubElement(audio, "track")

            # Add clips to timeline
            for i, clip in enumerate(clips):
                self._add_clip_to_track(
                    video_track,
                    audio_track,
                    clip,
                    source_video_path,
                    i
                )

            # Write to file
            tree = ET.ElementTree(root)
            tree.write(
                output_path,
                pretty_print=True,
                xml_declaration=True,
                encoding='UTF-8'
            )

            logger.info(f"Generated Premiere XML: {output_path}")
            return output_path

        except Exception as e:
            logger.error(f"XML generation failed: {e}")
            raise

    def _add_clip_to_track(
        self,
        video_track: ET.Element,
        audio_track: ET.Element,
        clip: Dict[str, Any],
        source_path: str,
        clip_index: int
    ):
        """Add a single clip to video and audio tracks."""

        start_frame = self._frames_from_seconds(clip['start_time'])
        end_frame = self._frames_from_seconds(clip['end_time'])
        duration_frames = end_frame - start_frame

        # Calculate timeline position (stack clips sequentially)
        timeline_position = clip_index * (duration_frames + 30)  # 30 frames gap

        # Video clip item
        video_clip = ET.SubElement(video_track, "clipitem")
        ET.SubElement(video_clip, "name").text = f"Clip_{clip_index:03d}"
        ET.SubElement(video_clip, "start").text = str(timeline_position)
        ET.SubElement(video_clip, "end").text = str(timeline_position + duration_frames)
        ET.SubElement(video_clip, "in").text = str(start_frame)
        ET.SubElement(video_clip, "out").text = str(end_frame)

        # File reference
        file_elem = ET.SubElement(video_clip, "file")
        ET.SubElement(file_elem, "name").text = Path(source_path).name
        ET.SubElement(file_elem, "pathurl").text = f"file://localhost{source_path}"

        # Rate
        rate = ET.SubElement(file_elem, "rate")
        ET.SubElement(rate, "timebase").text = str(self.timeline_fps)

        # Audio clip item (similar structure)
        audio_clip = ET.SubElement(audio_track, "clipitem")
        ET.SubElement(audio_clip, "name").text = f"Clip_{clip_index:03d}_Audio"
        ET.SubElement(audio_clip, "start").text = str(timeline_position)
        ET.SubElement(audio_clip, "end").text = str(timeline_position + duration_frames)
        ET.SubElement(audio_clip, "in").text = str(start_frame)
        ET.SubElement(audio_clip, "out").text = str(end_frame)

        # Audio file reference
        audio_file = ET.SubElement(audio_clip, "file")
        ET.SubElement(audio_file, "name").text = Path(source_path).name
        ET.SubElement(audio_file, "pathurl").text = f"file://localhost{source_path}"

    def _frames_from_seconds(self, seconds: float) -> int:
        """Convert seconds to frame count."""
        return int(seconds * self.timeline_fps)


def export_clips_to_premiere(
    clips: List[Dict[str, Any]],
    source_video: str,
    output_xml: str
) -> str:
    """
    Helper function to export clips to Premiere XML.

    Args:
        clips: List of clips with start/end times
        source_video: Path to source video
        output_xml: Output XML path

    Returns:
        Path to generated XML file
    """
    generator = PremiereXMLGenerator()
    return generator.generate_xml(clips, source_video, output_xml)
