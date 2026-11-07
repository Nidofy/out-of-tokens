#![windows_subsystem = "windows"]
fn main() {
    tauri::Builder::default().run(tauri::generate_context!()).expect("Unable to open Out of Tokens desktop");
}
