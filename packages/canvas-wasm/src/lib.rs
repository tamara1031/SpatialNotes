mod renderer;

use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};
use rstar::{RTree, AABB, RTreeObject};
use uuid::Uuid;

#[wasm_bindgen]
pub fn init_engine() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
    web_sys::console::log_1(&"Canvas Wasm Engine (Unified Rust Core) Initialized".into());
}

// --- Data Models ---

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[serde(tag = "type")]
pub enum ElementData {
    #[serde(rename = "ELEMENT_STROKE")]
    Stroke {
        points: Vec<f64>,
        #[serde(default)]
        pressures: Option<Vec<f32>>,
        #[serde(default)]
        tilt_xs: Option<Vec<f32>>,
        #[serde(default)]
        tilt_ys: Option<Vec<f32>>,
        color: String,
        width: f64,
    },

    #[serde(rename = "ELEMENT_TEXT")]
    Text {
        content: String,
        color: String,
        size: f64,
        bounds: Option<[f64; 4]>, // [min_x, min_y, max_x, max_y]
    },
    #[serde(rename = "ELEMENT_IMAGE")]
    Image {
        src: String,
        width: f64,
        height: f64,
        bounds: Option<[f64; 4]>,
    },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct Element {
    pub id: String,
    pub parent_id: Option<String>,
    pub data: ElementData,
}

impl RTreeObject for Element {
    type Envelope = AABB<[f64; 2]>;
    fn envelope(&self) -> Self::Envelope {
        match &self.data {
            ElementData::Stroke { points, .. } => {
                if points.len() < 2 { return AABB::from_corners([0.0, 0.0], [0.0, 0.0]); }
                let mut min_x = points[0];
                let mut min_y = points[1];
                let mut max_x = points[0];
                let mut max_y = points[1];
                for i in (0..points.len()).step_by(2) {
                    min_x = min_x.min(points[i]);
                    min_y = min_y.min(points[i+1]);
                    max_x = max_x.max(points[i]);
                    max_y = max_y.max(points[i+1]);
                }
                AABB::from_corners([min_x, min_y], [max_x, max_y])
            },
            ElementData::Text { bounds, .. } | ElementData::Image { bounds, .. } => {
                if let Some(b) = bounds {
                    AABB::from_corners([b[0], b[1]], [b[2], b[3]])
                } else {
                    AABB::from_corners([0.0, 0.0], [0.0, 0.0])
                }
            }
        }
    }
}

// --- Pure Rust Engine Core ---

pub struct EngineCore {
    tree: RTree<Element>,
    page_width: f64,
    page_height: f64,
    current_stroke: Vec<f64>,
    current_pressures: Vec<f32>,
    current_tilt_xs: Vec<f32>,
    current_tilt_ys: Vec<f32>,
    pub(crate) renderer: Option<renderer::WgpuRenderer>,
}

impl EngineCore {
    pub fn new(width: f64, height: f64) -> Self {
        EngineCore {
            tree: RTree::new(),
            page_width: width,
            page_height: height,
            current_stroke: Vec::new(),
            current_pressures: Vec::new(),
            current_tilt_xs: Vec::new(),
            current_tilt_ys: Vec::new(),
            renderer: None,
        }
    }

    pub fn pointer_down(&mut self, x: f64, y: f64, pressure: f32, tilt_x: f32, tilt_y: f32) {
        self.current_stroke = vec![x, y];
        self.current_pressures = vec![pressure];
        self.current_tilt_xs = vec![tilt_x];
        self.current_tilt_ys = vec![tilt_y];
    }

    pub fn pointer_move(&mut self, x: f64, y: f64, pressure: f32, tilt_x: f32, tilt_y: f32) {
        if self.current_stroke.len() >= 2 {
            // Avoid duplicate points
            let last_x = self.current_stroke[self.current_stroke.len() - 2];
            let last_y = self.current_stroke[self.current_stroke.len() - 1];
            if (x - last_x).abs() > 0.01 || (y - last_y).abs() > 0.01 {
                self.current_stroke.push(x);
                self.current_stroke.push(y);
                self.current_pressures.push(pressure);
                self.current_tilt_xs.push(tilt_x);
                self.current_tilt_ys.push(tilt_y);
            }
        } else {
            self.current_stroke.push(x);
            self.current_stroke.push(y);
            self.current_pressures.push(pressure);
            self.current_tilt_xs.push(tilt_x);
            self.current_tilt_ys.push(tilt_y);
        }
    }


    pub fn get_interaction_points_with_prediction(&self) -> Vec<f64> {
        if self.current_stroke.len() < 4 {
            return self.current_stroke.clone();
        }

        let mut points = self.current_stroke.clone();
        
        // Simple linear prediction
        let n = points.len();
        let x1 = points[n-4];
        let y1 = points[n-3];
        let x2 = points[n-2];
        let y2 = points[n-1];

        let vx = x2 - x1;
        let vy = y2 - y1;

        // Add 2 predicted points
        points.push(x2 + vx);
        points.push(y2 + vy);
        points.push(x2 + vx * 1.5);
        points.push(y2 + vy * 1.5);

        points
    }

    pub fn pointer_up(&mut self) -> (Vec<f64>, Vec<f32>, Vec<f32>, Vec<f32>) {
        let path = self.current_stroke.clone();
        let pressures = self.current_pressures.clone();
        let tilt_xs = self.current_tilt_xs.clone();
        let tilt_ys = self.current_tilt_ys.clone();
        
        self.current_stroke.clear();
        self.current_pressures.clear();
        self.current_tilt_xs.clear();
        self.current_tilt_ys.clear();
        
        (path, pressures, tilt_xs, tilt_ys)
    }


    pub fn get_interaction_points_ptr(&self) -> *const f64 {
        self.current_stroke.as_ptr()
    }

    pub fn get_interaction_points_len(&self) -> usize {
        self.current_stroke.len()
    }

    pub fn get_current_stroke_path(&self) -> String {
        points_to_svg_path_smoothed(&self.current_stroke)
    }

    pub fn get_current_interaction_points(&self) -> &[f64] {
        &self.current_stroke
    }

    pub fn upsert_element(&mut self, element: Element) {
        // Remove old version if exists
        let items: Vec<Element> = self.tree.iter().filter(|el| el.id == element.id).cloned().collect();
        for item in items {
            self.tree.remove(&item);
        }
        self.tree.insert(element);
    }

    pub fn remove_element(&mut self, id: &str) {
        let items: Vec<Element> = self.tree.iter().filter(|el| el.id == id).cloned().collect();
        for item in items {
            self.tree.remove(&item);
        }
    }

    pub fn clear(&mut self) {
        self.tree = RTree::new();
    }

    pub fn query_eraser(&self, path: &[f64], radius: f64) -> Vec<String> {
        let mut intersected_ids = Vec::new();
        let r2 = radius * radius;

        for i in (0..path.len()).step_by(2) {
            let px = path[i];
            let py = path[i+1];
            
            let envelope = AABB::from_corners([px - radius, py - radius], [px + radius, py + radius]);
            for el in self.tree.locate_in_envelope_intersecting(&envelope) {
                if intersected_ids.contains(&el.id) { continue; }
                
                let is_hit = match &el.data {
                    ElementData::Stroke { points, .. } => {

                        let mut hit = false;
                        for j in (0..points.len()).step_by(2) {
                            let dx = points[j] - px;
                            let dy = points[j+1] - py;
                            if dx * dx + dy * dy < r2 {
                                hit = true;
                                break;
                            }
                        }
                        hit
                    },
                    _ => true,
                };
                if is_hit { intersected_ids.push(el.id.clone()); }
            }
        }
        intersected_ids
    }

    pub fn partial_erase(&self, element: &Element, eraser_path: &[f64], radius: f64) -> Option<Vec<Element>> {
        let (points, color, width) = match &element.data {
            ElementData::Stroke { points, color, width, .. } => (points, color, width),

            _ => return None,
        };

        let mut keep = vec![true; points.len() / 2];
        let r2 = radius * radius;

        for i in 0..keep.len() {
            let px = points[i * 2];
            let py = points[i * 2 + 1];
            for j in (0..eraser_path.len()).step_by(2) {
                let dx = px - eraser_path[j];
                let dy = py - eraser_path[j+1];
                if dx * dx + dy * dy < r2 {
                    keep[i] = false;
                    break;
                }
            }
        }

        if keep.iter().all(|&k| k) { return None; }
        if keep.iter().all(|&k| !k) { return Some(Vec::new()); }

        let mut fragments = Vec::new();
        let mut current_points = Vec::new();

        for i in 0..keep.len() {
            if keep[i] {
                current_points.push(points[i * 2]);
                current_points.push(points[i * 2 + 1]);
            } else {
                if current_points.len() >= 4 {
                    fragments.push(self.create_stroke_fragment(element, &current_points, color, *width));
                }
                current_points.clear();
            }
        }
        if current_points.len() >= 4 {
            fragments.push(self.create_stroke_fragment(element, &current_points, color, *width));
        }

        Some(fragments)
    }

    fn create_stroke_fragment(&self, original: &Element, points: &[f64], color: &str, width: f64) -> Element {
        let (pressures, tilt_xs, tilt_ys) = if let ElementData::Stroke { pressures, tilt_xs, tilt_ys, .. } = &original.data {
             // For now, simple trimming of metadata arrays if we have indices.
             // But partial_erase logic is complex for high-fidelity data.
             // We'll pass through original metadata for now if applicable.
             (pressures.clone(), tilt_xs.clone(), tilt_ys.clone())
        } else { (None, None, None) };

        Element {
            id: Uuid::new_v4().to_string(),
            parent_id: original.parent_id.clone(),
            data: ElementData::Stroke { 
                points: points.to_vec(), 
                pressures,
                tilt_xs,
                tilt_ys,
                color: color.to_string(), 
                width 
            },
        }
    }


    pub fn export_svg(&self) -> String {
        let mut elements_svg = Vec::new();
        for el in self.tree.iter() {
            let svg = match &el.data {
                ElementData::Stroke { points, color, width, .. } => {
                    let d = points_to_svg_path_smoothed(points);
                    format!(r#"<path d="{}" stroke="{}" stroke-width="{}" fill="none" stroke-linecap="round" stroke-linejoin="round" />"#, d, color, width)
                },

                ElementData::Text { content, color, size, .. } => {
                    let b = el.envelope();
                    format!(r#"<text x="{}" y="{}" fill="{}" font-size="{}" font-family="sans-serif">{}</text>"#, b.lower()[0], b.upper()[1], color, size, content)
                },
                ElementData::Image { src, width, height, .. } => {
                    let b = el.envelope();
                    format!(r#"<image x="{}" y="{}" width="{}" height="{}" href="{}" />"#, b.lower()[0], b.lower()[1], width, height, src)
                }
            };
            elements_svg.push(svg);
        }

        format!(
            r#"<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="{}mm" height="{}mm" viewBox="0 0 {} {}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="white" />
  {}
</svg>"#,
            self.page_width, self.page_height, self.page_width, self.page_height,
            elements_svg.join("\n  ")
        )
    }
}

// --- Wasm Wrapper ---

#[wasm_bindgen]
pub struct CanvasEngine {
    core: EngineCore,
}

#[wasm_bindgen]
impl CanvasEngine {
    #[wasm_bindgen(constructor)]
    pub fn new(width: f64, height: f64) -> Self {
        CanvasEngine { core: EngineCore::new(width, height) }
    }

    #[wasm_bindgen(js_name = upsertElement)]
    pub fn upsert_element(&mut self, element_js: JsValue) {
        if let Ok(element) = serde_wasm_bindgen::from_value::<Element>(element_js) {
            self.core.upsert_element(element);
        }
    }

    #[wasm_bindgen(js_name = removeElement)]
    pub fn remove_element(&mut self, id: String) {
        self.core.remove_element(&id);
    }

    #[wasm_bindgen(js_name = clear)]
    pub fn clear(&mut self) {
        self.core.clear();
    }

    #[wasm_bindgen(js_name = queryEraser)]
    pub fn query_eraser(&self, path_js: JsValue, radius: f64) -> JsValue {
        let path: Vec<f64> = serde_wasm_bindgen::from_value(path_js).unwrap_or_default();
        let result = self.core.query_eraser(&path, radius);
        serde_wasm_bindgen::to_value(&result).unwrap_or(JsValue::NULL)
    }
    
    #[wasm_bindgen(js_name = partialErase)]
    pub fn partial_erase(&self, element_js: JsValue, eraser_path_js: JsValue, radius: f64) -> JsValue {
        if let Ok(element) = serde_wasm_bindgen::from_value::<Element>(element_js) {
            let eraser_path: Vec<f64> = serde_wasm_bindgen::from_value(eraser_path_js).unwrap_or_default();
            if let Some(fragments) = self.core.partial_erase(&element, &eraser_path, radius) {
                return serde_wasm_bindgen::to_value(&fragments).unwrap_or(JsValue::NULL);
            }
        }
        JsValue::NULL
    }

    #[wasm_bindgen(js_name = pointerDown)]
    pub fn pointer_down(&mut self, x: f64, y: f64, pressure: f32, tilt_x: f32, tilt_y: f32) {
        self.core.pointer_down(x, y, pressure, tilt_x, tilt_y);
    }

    #[wasm_bindgen(js_name = pointerMove)]
    pub fn pointer_move(&mut self, x: f64, y: f64, pressure: f32, tilt_x: f32, tilt_y: f32) {
        self.core.pointer_move(x, y, pressure, tilt_x, tilt_y);
    }

    #[wasm_bindgen(js_name = pointerUp)]
    pub fn pointer_up(&mut self) -> JsValue {
        let (path, pressures, tilt_xs, tilt_ys) = self.core.pointer_up();
        
        #[derive(Serialize)]
        struct PointerUpResult {
            points: Vec<f64>,
            pressures: Vec<f32>,
            tilt_xs: Vec<f32>,
            tilt_ys: Vec<f32>,
            #[serde(rename = "boundingBox")]
            bounding_box: Option<[f64; 4]>,
        }
        
        // Calculate bounding box here for convenience
        let bounding_box = if path.len() >= 2 {
            let mut min_x = path[0];
            let mut min_y = path[1];
            let mut max_x = path[0];
            let mut max_y = path[1];
            for i in (0..path.len()).step_by(2) {
                min_x = min_x.min(path[i]);
                min_y = min_y.min(path[i+1]);
                max_x = max_x.max(path[i]);
                max_y = max_y.max(path[i+1]);
            }
            Some([min_x, min_y, max_x, max_y])
        } else { None };

        let res = PointerUpResult {
            points: path,
            pressures,
            tilt_xs,
            tilt_ys,
            bounding_box,
        };
        serde_wasm_bindgen::to_value(&res).unwrap_or(JsValue::NULL)
    }


    #[wasm_bindgen(js_name = getInteractionPointsPtr)]
    pub fn get_interaction_points_ptr(&self) -> *const f64 {
        self.core.get_interaction_points_ptr()
    }

    #[wasm_bindgen(js_name = getInteractionPointsLen)]
    pub fn get_interaction_points_len(&self) -> usize {
        self.core.get_interaction_points_len()
    }

    #[wasm_bindgen(js_name = bindCanvas)]
    pub async fn bind_canvas(&mut self, canvas: JsValue) {
        let renderer = renderer::WgpuRenderer::new(canvas).await;
        self.core.renderer = Some(renderer);
    }

    #[wasm_bindgen(js_name = getCurrentStrokePath)]
    pub fn get_current_stroke_path(&self) -> String {
        let points = self.core.get_interaction_points_with_prediction();
        points_to_svg_path_smoothed(&points)
    }

    #[wasm_bindgen(js_name = getCurrentInteractionPoints)]
    pub fn get_current_interaction_points(&self) -> JsValue {
        serde_wasm_bindgen::to_value(&self.core.get_current_interaction_points()).unwrap_or(JsValue::NULL)
    }

    #[wasm_bindgen(js_name = exportSvg)]
    pub fn export_svg(&self) -> String {
        self.core.export_svg()
    }
}

#[wasm_bindgen]
pub fn smooth_stroke_svg(points_js: JsValue) -> String {
    let points: Vec<f64> = serde_wasm_bindgen::from_value(points_js).unwrap_or_default();
    points_to_svg_path_smoothed(&points)
}

// --- Geometry Helpers (Smoothing) ---

fn points_to_svg_path_smoothed(points: &[f64]) -> String {
    if points.len() < 4 { return "".to_string(); }
    if points.len() == 4 {
        return format!("M {:.2} {:.2} L {:.2} {:.2}", points[0], points[1], points[2], points[3]);
    }

    let mut d = format!("M {:.2} {:.2}", points[0], points[1]);
    
    // Catmull-Rom to Cubic Bezier conversion
    // For each segment [p0, p1, p2, p3], we generate a cubic bezier
    for i in 0..(points.len() / 2 - 1) {
        let p0 = if i == 0 { (points[0], points[1]) } else { (points[(i-1)*2], points[(i-1)*2+1]) };
        let p1 = (points[i*2], points[i*2+1]);
        let p2 = (points[(i+1)*2], points[(i+1)*2+1]);
        let p3 = if i + 2 >= points.len() / 2 { p2 } else { (points[(i+2)*2], points[(i+2)*2+1]) };

        // Control points
        let cp1x = p1.0 + (p2.0 - p0.0) / 6.0;
        let cp1y = p1.1 + (p2.1 - p0.1) / 6.0;
        let cp2x = p2.0 - (p3.0 - p1.0) / 6.0;
        let cp2y = p2.1 - (p3.1 - p1.1) / 6.0;

        d.push_str(&format!(" C {:.2} {:.2}, {:.2} {:.2}, {:.2} {:.2}", cp1x, cp1y, cp2x, cp2y, p2.0, p2.1));
    }
    
    d
}
