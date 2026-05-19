package com.creating.chatApplication.service;

import com.creating.chatApplication.entity.Theme;
import com.creating.chatApplication.entity.ThemeData;
import com.creating.chatApplication.entity.User;
import com.creating.chatApplication.repository.ThemeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Optional;

@Service
public class ThemeServiceImpl implements ThemeService {

    @Autowired
    private ThemeRepository themeRepository;

    @Autowired
    private UserService userService;

    @PostConstruct
    public void init() {
        loadAndSaveThemes();
    }

    public void loadAndSaveThemes() {
        List<ThemeData> defaultThemes = loadDefaultThemes();

        for (ThemeData theme : defaultThemes) {
            Theme newTheme = new Theme();
            newTheme.setThemeName(theme.getFileName());
            themeRepository.save(newTheme);
        }
    }

    @Override
    public List<ThemeData> loadDefaultThemes() {
        List<ThemeData> defaultThemes = new ArrayList<>();

        // Use Spring's Resource pattern resolver to find files inside the JAR
        ResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();

        try {
            // "classpath*:" scans inside the packed jar resources matching the wildcard pattern
            Resource[] resources = resolver.getResources("classpath:/static/images/themes/*");
            if (resources != null && resources.length > 0) {
                for (Resource resource : resources) {
                    String filename = resource.getFilename();
                    // Double-check we have a valid filename and it isn't already saved
                    if (filename != null && !filename.isEmpty()) {
                        if (themeRepository.findByThemeName(filename).isEmpty()) {
                            defaultThemes.add(new ThemeData(filename));
                        }
                    }
                }
            } else {
                System.out.println("Themes directory is empty or could not be resolved on the classpath.");
            }
        } catch (IOException e) {
            System.err.println("Failed to read theme files from classpath: " + e.getMessage());
        }

        return defaultThemes;
    }

    @Override
    public void setTheme(int id) {
        User currentUser = userService.getCurrentUser();
        Optional<Theme> optionalTheme = themeRepository.findById(id);
        optionalTheme.ifPresentOrElse(
                theme -> {
                    currentUser.setTheme(theme);
                    userService.saveUser(currentUser);
                },
                () -> {
                    throw new RuntimeException("Theme not found");
                }
        );
    }

    private String convertImageToBase64(String imagePath) {
        try {
            byte[] fileContent = Files.readAllBytes(new File(imagePath).toPath());
            return Base64.getEncoder().encodeToString(fileContent);
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }
}