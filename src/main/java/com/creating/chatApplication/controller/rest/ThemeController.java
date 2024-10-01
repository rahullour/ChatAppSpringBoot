package com.creating.chatApplication.controller.rest;

import com.creating.chatApplication.entity.Theme;
import com.creating.chatApplication.entity.ThemeData;
import com.creating.chatApplication.repository.ThemeRepository;
import com.creating.chatApplication.service.NotificationManager;
import com.creating.chatApplication.service.ThemeService;
import com.creating.chatApplication.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

@RestController
@RequestMapping("/api")
public class ThemeController {

    @Autowired
    private ThemeRepository themeRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private NotificationManager notificationManager;

    @Autowired
    private ThemeService themeService;

    @GetMapping("/themes")
    public List<ThemeData> getThemes() {
        List<Theme> themes = themeRepository.findAll();
        List<ThemeData> themeDataList = new ArrayList<>();

        for (Theme theme : themes) {
            ThemeData themeData = new ThemeData(theme.getId(), theme.getThemeUrlCompressed());
            themeDataList.add(themeData);
        }

        return themeDataList; // Return the list of ThemeData objects
    }

    @GetMapping("/currentTheme")
    public Theme getCurrentThemes() {
        return userService.getCurrentUser().getTheme();
    }


    @GetMapping("/setTheme")
    public ResponseEntity<String> setTheme(@RequestParam int themeId) {
        // Check if the theme exists in the database
        if (!themeRepository.existsById(themeId)) {
            return new ResponseEntity<>("Theme not found", HttpStatus.NOT_FOUND);
        }

        themeService.setTheme(themeId);
        // For demonstration, we're just returning a success message
        return new ResponseEntity<>("Theme updated successfully", HttpStatus.OK);
    }

    @GetMapping("/themeImage")
    public ResponseEntity<String> getThemeImage(@RequestParam int themeId) {
        Theme theme = themeRepository.findById(themeId).orElse(null);
        if (theme == null) {
            return new ResponseEntity<>("Theme not found", HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(theme.getThemeUrl(), HttpStatus.OK);
    }

}