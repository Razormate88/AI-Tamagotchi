use tauri::{
    AppHandle, Emitter, LogicalSize, Manager, PhysicalPosition, PhysicalSize, WebviewWindow,
};

pub const MENU_LOGICAL_WIDTH: f64 = 200.0;
pub const MENU_LOGICAL_HEIGHT: f64 = 360.0;

/// Logs concise native window state and monitor diagnostics to the terminal.
pub fn log_window_diagnostics(context: &str, window: &WebviewWindow) {
    let is_visible = window.is_visible().unwrap_or(false);
    let is_minimized = window.is_minimized().unwrap_or(false);
    let outer_pos = window.outer_position().ok();
    let outer_size = window.outer_size().ok();
    let scale_factor = window.scale_factor().unwrap_or(1.0);
    let monitor_info = window.current_monitor().ok().flatten().map(|m| {
        format!(
            "name={:?}, size={:?}, pos={:?}, scale={}",
            m.name(),
            m.size(),
            m.position(),
            m.scale_factor()
        )
    });

    println!(
        "[DIAGNOSTIC][Native] Context: {} | visible: {}, minimized: {}, pos: {:?}, size: {:?}, scale: {}, monitor: {:?}",
        context, is_visible, is_minimized, outer_pos, outer_size, scale_factor, monitor_info
    );
}

/// Robustly ensures the pet window is visible, unminimized, sized properly, and on an available monitor.
pub fn show_pet_authoritative(window: &WebviewWindow) -> Result<(), String> {
    let _ = window.unminimize();

    // Check if current geometry is valid and intersects an available monitor
    let is_geometry_valid =
        if let (Ok(pos), Ok(size)) = (window.outer_position(), window.outer_size()) {
            if size.width < 100 || size.height < 100 {
                false
            } else if let Ok(monitors) = window.available_monitors() {
                let mut onscreen = false;
                for mon in &monitors {
                    let mpos = mon.position();
                    let msize = mon.size();
                    let mon_x1 = mpos.x;
                    let mon_y1 = mpos.y;
                    let mon_x2 = mpos.x + msize.width as i32;
                    let mon_y2 = mpos.y + msize.height as i32;

                    let intersect_x1 = pos.x.max(mon_x1);
                    let intersect_y1 = pos.y.max(mon_y1);
                    let intersect_x2 = (pos.x + size.width as i32).min(mon_x2);
                    let intersect_y2 = (pos.y + size.height as i32).min(mon_y2);

                    if (intersect_x2 - intersect_x1) >= 50 && (intersect_y2 - intersect_y1) >= 50 {
                        onscreen = true;
                        break;
                    }
                }
                onscreen
            } else {
                false
            }
        } else {
            false
        };

    if !is_geometry_valid {
        println!("[DIAGNOSTIC][Native] Show Pet detected invalid/offscreen geometry. Repairing...");
        reset_window_position_authoritative(window)?;
    } else {
        window.show().map_err(|e| e.to_string())?;
        let _ = window.set_focus();
        log_window_diagnostics("show_pet", window);
    }

    Ok(())
}

/// Authoritatively resets window position and size to standard safe visible bounds on screen.
pub fn reset_window_position_authoritative(window: &WebviewWindow) -> Result<(), String> {
    // Find the primary or current monitor
    let monitor = window
        .current_monitor()
        .ok()
        .flatten()
        .or_else(|| window.primary_monitor().ok().flatten())
        .or_else(|| {
            window
                .available_monitors()
                .ok()
                .and_then(|m| m.into_iter().next())
        })
        .ok_or_else(|| "No monitor found to position window".to_string())?;

    let monitor_pos = monitor.position();
    let monitor_size = monitor.size();
    let scale_factor = monitor.scale_factor();

    // Standard reset size: 220x220 logical pixels (Medium preset)
    let target_logical_size = 220.0;
    let target_phys_size = (target_logical_size * scale_factor).round() as u32;

    let _ = window.set_size(PhysicalSize::new(target_phys_size, target_phys_size));

    // Place safely in the lower-right area with 60px margin from screen edges
    let margin = (60.0 * scale_factor).round() as i32;
    let mut safe_x = monitor_pos.x + monitor_size.width as i32 - target_phys_size as i32 - margin;
    let mut safe_y = monitor_pos.y + monitor_size.height as i32 - target_phys_size as i32 - margin;

    // Ensure the window does not sit above or left of the monitor boundary
    if safe_x < monitor_pos.x {
        safe_x = monitor_pos.x + 20;
    }
    if safe_y < monitor_pos.y {
        safe_y = monitor_pos.y + 20;
    }

    window
        .set_position(PhysicalPosition::new(safe_x, safe_y))
        .map_err(|e| e.to_string())?;

    let _ = window.unminimize();
    window.show().map_err(|e| e.to_string())?;
    let _ = window.set_focus();

    log_window_diagnostics("reset_window_position", window);

    Ok(())
}

/// Calculates the optimal onscreen physical position for the companion menu popup window.
/// Preferred placement order:
/// 1. Right side of pet
/// 2. Left side if insufficient room
/// 3. Below if appropriate
/// 4. Above if necessary
/// Clamped strictly inside the monitor work area.
pub fn calculate_menu_position(
    pet_pos: PhysicalPosition<i32>,
    pet_size: PhysicalSize<u32>,
    click_offset: Option<(f64, f64)>,
    monitor_pos: PhysicalPosition<i32>,
    monitor_size: PhysicalSize<u32>,
    scale_factor: f64,
    menu_logical_width: f64,
    menu_logical_height: f64,
) -> PhysicalPosition<i32> {
    let menu_phys_w = (menu_logical_width * scale_factor).round() as i32;
    let menu_phys_h = (menu_logical_height * scale_factor).round() as i32;

    let gap = (8.0 * scale_factor).round() as i32;
    let edge_margin = (8.0 * scale_factor).round() as i32;

    let mon_min_x = monitor_pos.x;
    let mon_min_y = monitor_pos.y;
    let mon_max_x = monitor_pos.x + monitor_size.width as i32;
    let mon_max_y = monitor_pos.y + monitor_size.height as i32;

    let safe_min_x = mon_min_x + edge_margin;
    let safe_max_x = (mon_max_x - edge_margin - menu_phys_w).max(safe_min_x);
    let safe_min_y = mon_min_y + edge_margin;
    let safe_max_y = (mon_max_y - edge_margin - menu_phys_h).max(safe_min_y);

    let pet_x = pet_pos.x;
    let pet_y = pet_pos.y;
    let pet_w = pet_size.width as i32;
    let pet_h = pet_size.height as i32;

    // Anchor Y near click offset or top of pet
    let anchor_y_offset = match click_offset {
        Some((_, cy)) => (cy * scale_factor).round() as i32,
        None => 0,
    };
    let initial_y = pet_y + anchor_y_offset;

    // 1. Right side of pet
    let right_x = pet_x + pet_w + gap;
    let can_fit_right = (right_x + menu_phys_w) <= (mon_max_x - edge_margin);

    // 2. Left side of pet
    let left_x = pet_x - gap - menu_phys_w;
    let can_fit_left = left_x >= (mon_min_x + edge_margin);

    // 3. Below pet
    let below_y = pet_y + pet_h + gap;
    let can_fit_below = (below_y + menu_phys_h) <= (mon_max_y - edge_margin);

    // 4. Above pet
    let above_y = pet_y - gap - menu_phys_h;
    let can_fit_above = above_y >= (mon_min_y + edge_margin);

    let (target_x, target_y) = if can_fit_right {
        (right_x, initial_y)
    } else if can_fit_left {
        (left_x, initial_y)
    } else if can_fit_below {
        (pet_x, below_y)
    } else if can_fit_above {
        (pet_x, above_y)
    } else {
        (right_x, initial_y)
    };

    // Clamp strictly within monitor work area
    let clamped_x = target_x.clamp(safe_min_x, safe_max_x);
    let clamped_y = target_y.clamp(safe_min_y, safe_max_y);

    PhysicalPosition::new(clamped_x, clamped_y)
}

/// Authoritatively positions and shows the companion menu popup window adjacent to Gloop.
pub fn open_companion_menu_authoritative(
    app: &AppHandle,
    click_x: Option<f64>,
    click_y: Option<f64>,
) -> Result<(), String> {
    let main_window = app
        .get_webview_window("main")
        .ok_or_else(|| "Main pet window not found".to_string())?;

    let menu_window = match app.get_webview_window("companion-menu") {
        Some(w) => w,
        None => tauri::WebviewWindowBuilder::new(
            app,
            "companion-menu",
            tauri::WebviewUrl::App("index.html".into()),
        )
        .title("AI-Tamagotchi Companion Menu")
        .inner_size(MENU_LOGICAL_WIDTH, MENU_LOGICAL_HEIGHT)
        .resizable(false)
        .transparent(true)
        .decorations(false)
        .shadow(false)
        .always_on_top(true)
        .skip_taskbar(true)
        .visible(false)
        .build()
        .map_err(|e| format!("Failed to create companion-menu window: {}", e))?,
    };

    let main_pos = main_window.outer_position().map_err(|e| e.to_string())?;
    let main_size = main_window.outer_size().map_err(|e| e.to_string())?;

    let monitor = main_window
        .current_monitor()
        .ok()
        .flatten()
        .or_else(|| main_window.primary_monitor().ok().flatten())
        .or_else(|| {
            main_window
                .available_monitors()
                .ok()
                .and_then(|m| m.into_iter().next())
        })
        .ok_or_else(|| "No monitor found for menu placement".to_string())?;

    let monitor_pos = monitor.position();
    let monitor_size = monitor.size();
    let scale_factor = monitor.scale_factor();

    let click_offset = match (click_x, click_y) {
        (Some(x), Some(y)) => Some((x, y)),
        _ => None,
    };

    let target_pos = calculate_menu_position(
        main_pos,
        main_size,
        click_offset,
        *monitor_pos,
        *monitor_size,
        scale_factor,
        MENU_LOGICAL_WIDTH,
        MENU_LOGICAL_HEIGHT,
    );

    let phys_width = (MENU_LOGICAL_WIDTH * scale_factor).round() as u32;
    let phys_height = (MENU_LOGICAL_HEIGHT * scale_factor).round() as u32;

    let _ = menu_window.set_size(PhysicalSize::new(phys_width, phys_height));
    menu_window
        .set_position(target_pos)
        .map_err(|e| e.to_string())?;

    let _ = menu_window.set_always_on_top(true);
    menu_window.show().map_err(|e| e.to_string())?;
    let _ = menu_window.set_focus();

    let _ = app.emit("companion-menu-shown", ());

    log_window_diagnostics("open_companion_menu", &menu_window);

    Ok(())
}

#[tauri::command]
pub fn reset_window_position(app: AppHandle) -> Result<(), String> {
    if let Some(menu_window) = app.get_webview_window("companion-menu") {
        let _ = menu_window.hide();
    }
    if let Some(main_window) = app.get_webview_window("main") {
        reset_window_position_authoritative(&main_window)?;
    }
    Ok(())
}

#[tauri::command]
pub fn show_pet(app: AppHandle) -> Result<(), String> {
    if let Some(main_window) = app.get_webview_window("main") {
        show_pet_authoritative(&main_window)?;
    }
    Ok(())
}

#[tauri::command]
pub fn hide_pet(app: AppHandle) -> Result<(), String> {
    if let Some(menu_window) = app.get_webview_window("companion-menu") {
        let _ = menu_window.hide();
    }
    if let Some(main_window) = app.get_webview_window("main") {
        main_window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn open_companion_menu(
    app: AppHandle,
    click_x: Option<f64>,
    click_y: Option<f64>,
) -> Result<(), String> {
    open_companion_menu_authoritative(&app, click_x, click_y)
}

#[tauri::command]
pub fn toggle_companion_menu(
    app: AppHandle,
    click_x: Option<f64>,
    click_y: Option<f64>,
) -> Result<(), String> {
    if let Some(menu_window) = app.get_webview_window("companion-menu") {
        if let Ok(true) = menu_window.is_visible() {
            menu_window.hide().map_err(|e| e.to_string())?;
            return Ok(());
        }
    }
    open_companion_menu_authoritative(&app, click_x, click_y)
}

#[tauri::command]
pub fn hide_companion_menu(app: AppHandle) -> Result<(), String> {
    if let Some(menu_window) = app.get_webview_window("companion-menu") {
        menu_window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn get_pet_always_on_top(app: AppHandle) -> Result<bool, String> {
    if let Some(main_window) = app.get_webview_window("main") {
        main_window.is_always_on_top().map_err(|e| e.to_string())
    } else {
        Ok(false)
    }
}

#[tauri::command]
pub fn set_pet_always_on_top(app: AppHandle, always_on_top: bool) -> Result<(), String> {
    if let Some(main_window) = app.get_webview_window("main") {
        main_window
            .set_always_on_top(always_on_top)
            .map_err(|e| e.to_string())?;
        let _ = app.emit("tray-always-on-top-toggled", always_on_top);
    }
    Ok(())
}

#[tauri::command]
pub fn set_pet_size(app: AppHandle, width: f64, height: f64) -> Result<(), String> {
    if let Some(main_window) = app.get_webview_window("main") {
        main_window
            .set_size(LogicalSize::new(width, height))
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn report_frontend_stage(stage: String, details: Option<String>) {
    match details {
        Some(d) if !d.is_empty() => {
            println!("[DIAGNOSTIC][Frontend] Stage: {} ({})", stage, d);
        }
        _ => {
            println!("[DIAGNOSTIC][Frontend] Stage: {}", stage);
        }
    }
}

#[tauri::command]
pub fn report_frontend_error(stage: String, error: String) {
    eprintln!(
        "[DIAGNOSTIC][Frontend ERROR] Stage: {} | Error: {}",
        stage, error
    );
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_menu_position_right_side_default() {
        let pet_pos = PhysicalPosition::new(500, 400);
        let pet_size = PhysicalSize::new(220, 220);
        let monitor_pos = PhysicalPosition::new(0, 0);
        let monitor_size = PhysicalSize::new(1920, 1080);
        let scale = 1.0;

        let pos = calculate_menu_position(
            pet_pos,
            pet_size,
            None,
            monitor_pos,
            monitor_size,
            scale,
            200.0,
            360.0,
        );

        // Right side: 500 + 220 + 8 = 728
        expect_eq(pos.x, 728);
        expect_eq(pos.y, 400);
    }

    #[test]
    fn test_calculate_menu_position_flips_to_left_near_right_edge() {
        let pet_pos = PhysicalPosition::new(1750, 400);
        let pet_size = PhysicalSize::new(220, 220);
        let monitor_pos = PhysicalPosition::new(0, 0);
        let monitor_size = PhysicalSize::new(1920, 1080);
        let scale = 1.0;

        let pos = calculate_menu_position(
            pet_pos,
            pet_size,
            None,
            monitor_pos,
            monitor_size,
            scale,
            200.0,
            360.0,
        );

        // Left side: 1750 - 8 - 200 = 1542
        expect_eq(pos.x, 1542);
        expect_eq(pos.y, 400);
    }

    #[test]
    fn test_calculate_menu_position_clamps_bottom_edge() {
        let pet_pos = PhysicalPosition::new(500, 850);
        let pet_size = PhysicalSize::new(220, 220);
        let monitor_pos = PhysicalPosition::new(0, 0);
        let monitor_size = PhysicalSize::new(1920, 1080);
        let scale = 1.0;

        let pos = calculate_menu_position(
            pet_pos,
            pet_size,
            None,
            monitor_pos,
            monitor_size,
            scale,
            200.0,
            360.0,
        );

        // Right side: 728, Clamped bottom: 1080 - 8 - 360 = 712
        expect_eq(pos.x, 728);
        expect_eq(pos.y, 712);
    }

    #[test]
    fn test_calculate_menu_position_multi_monitor_offset() {
        // Second monitor on the right at x=1920
        let pet_pos = PhysicalPosition::new(2200, 300);
        let pet_size = PhysicalSize::new(220, 220);
        let monitor_pos = PhysicalPosition::new(1920, 0);
        let monitor_size = PhysicalSize::new(1920, 1080);
        let scale = 1.0;

        let pos = calculate_menu_position(
            pet_pos,
            pet_size,
            None,
            monitor_pos,
            monitor_size,
            scale,
            200.0,
            360.0,
        );

        // Right side: 2200 + 220 + 8 = 2428
        expect_eq(pos.x, 2428);
        expect_eq(pos.y, 300);
    }

    fn expect_eq(actual: i32, expected: i32) {
        assert_eq!(actual, expected);
    }
}
