use tauri::{
    menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager,
};

pub fn setup_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let show_pet = MenuItemBuilder::with_id("show_pet", "Show Pet").build(app)?;
    let hide_pet = MenuItemBuilder::with_id("hide_pet", "Hide Pet").build(app)?;
    let toggle_always_on_top =
        MenuItemBuilder::with_id("toggle_always_on_top", "Toggle Always on Top").build(app)?;
    let reset_position =
        MenuItemBuilder::with_id("reset_position", "Reset Window Position").build(app)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let quit = MenuItemBuilder::with_id("quit", "Quit AI Tamagotchi").build(app)?;

    let menu = MenuBuilder::new(app)
        .item(&show_pet)
        .item(&hide_pet)
        .item(&toggle_always_on_top)
        .item(&reset_position)
        .item(&separator)
        .item(&quit)
        .build()?;

    let icon = app
        .default_window_icon()
        .cloned()
        .ok_or("Default window icon missing")?;

    let _tray = TrayIconBuilder::with_id("main-tray")
        .tooltip("AI-Tamagotchi")
        .icon(icon)
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| {
            let id = event.id().as_ref();
            if let Some(window) = app.get_webview_window("main") {
                match id {
                    "show_pet" => {
                        let _ = window.unminimize();
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                    "hide_pet" => {
                        let _ = window.hide();
                    }
                    "toggle_always_on_top" => {
                        if let Ok(current) = window.is_always_on_top() {
                            let next = !current;
                            let _ = window.set_always_on_top(next);
                            let _ = app.emit("tray-always-on-top-toggled", next);
                        }
                    }
                    "reset_position" => {
                        let _ = crate::commands::reset_window_position(window);
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                }
            } else if id == "quit" {
                app.exit(0);
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    if let Ok(is_visible) = window.is_visible() {
                        if is_visible {
                            let _ = window.hide();
                        } else {
                            let _ = window.unminimize();
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                }
            }
        })
        .build(app)?;

    Ok(())
}
